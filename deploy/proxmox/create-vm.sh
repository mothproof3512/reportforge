#!/usr/bin/env bash
# Creates an Ubuntu 24.04 cloud-init VM on Proxmox and installs Reportforge in it.
# Run as root on the PVE host:
#
#   bash create-vm.sh --id 9100 --name reportforge --sshkey ~/.ssh/id_ed25519.pub \
#        --repo https://github.com/<you>/reportforge.git
#
# Networking is DHCP unless --ip and --gw are given (e.g. --ip 192.168.1.60/24 --gw 192.168.1.1).
# Defaults: 2 vCPU, 4 GB RAM, 40 GB disk on local-lvm, bridge vmbr0.
set -euo pipefail

ID=9100; NAME=reportforge; IP=""; GW=""; SSHKEY=""; REPO=""; BRIDGE=vmbr0; STORAGE=local-lvm; CORES=2; MEM=4096; DISK=40G; USER=rf
while [[ $# -gt 0 ]]; do
  case "$1" in
    --id) ID="$2"; shift 2;; --name) NAME="$2"; shift 2;; --ip) IP="$2"; shift 2;; --gw) GW="$2"; shift 2;;
    --sshkey) SSHKEY="$2"; shift 2;; --repo) REPO="$2"; shift 2;; --bridge) BRIDGE="$2"; shift 2;;
    --storage) STORAGE="$2"; shift 2;; --cores) CORES="$2"; shift 2;; --mem) MEM="$2"; shift 2;; --disk) DISK="$2"; shift 2;;
    *) echo "unknown option $1"; exit 1;;
  esac
done
[[ -z "$SSHKEY" || -z "$REPO" ]] && { echo "--sshkey and --repo are required"; exit 1; }
[[ -n "$IP" && -z "$GW" ]] && { echo "--gw is required when --ip is given"; exit 1; }
IPCONFIG="ip=dhcp"; [[ -n "$IP" ]] && IPCONFIG="ip=${IP},gw=${GW}"
[[ -f "$SSHKEY" ]] || { echo "ssh key $SSHKEY not found"; exit 1; }

IMG=/var/lib/vz/template/iso/noble-server-cloudimg-amd64.img
if [[ ! -f "$IMG" ]]; then
  echo "▶ downloading Ubuntu 24.04 cloud image"
  curl -L -o "$IMG" https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img
fi

mkdir -p /var/lib/vz/snippets
SNIPPET=/var/lib/vz/snippets/${NAME}-user-data.yaml
cat > "$SNIPPET" <<CLOUD
#cloud-config
hostname: ${NAME}
manage_etc_hosts: true
users:
  - name: ${USER}
    groups: [sudo, docker]
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - $(cat "$SSHKEY")
package_update: true
package_upgrade: true
packages: [qemu-guest-agent, git, ca-certificates, curl, gnupg, unattended-upgrades]
write_files:
  - path: /etc/apt/apt.conf.d/20auto-upgrades
    content: |
      APT::Periodic::Update-Package-Lists "1";
      APT::Periodic::Unattended-Upgrade "1";
runcmd:
  - systemctl enable --now qemu-guest-agent
  - install -m 0755 -d /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  - echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu noble stable" > /etc/apt/sources.list.d/docker.list
  - apt-get update
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  - systemctl enable --now docker
  - git clone ${REPO} /opt/reportforge
  - chown -R ${USER}:${USER} /opt/reportforge
  - mkdir -p /opt/reportforge/data && chown ${USER}:${USER} /opt/reportforge/data
  - cd /opt/reportforge && docker compose -f deploy/docker-compose.yml up -d --build
  - echo "reportforge ready" > /var/log/reportforge-install.done
CLOUD

echo "▶ creating VM ${ID} (${NAME})"
qm create "$ID" --name "$NAME" --memory "$MEM" --cores "$CORES" --cpu host --net0 "virtio,bridge=${BRIDGE}" \
   --scsihw virtio-scsi-single --agent enabled=1 --ostype l26 --serial0 socket --vga serial0
qm importdisk "$ID" "$IMG" "$STORAGE" --format qcow2 >/dev/null
# Volume names differ per storage type (LVM: vm-9100-disk-0, dir: 9100/vm-9100-disk-0.qcow2); take what Proxmox assigned
VOL=$(qm config "$ID" | sed -n 's/^unused0: //p')
[[ -z "$VOL" ]] && { echo "import failed: no unused disk found on $STORAGE"; exit 1; }
qm set "$ID" --scsi0 "${VOL},discard=on,ssd=1"
qm disk resize "$ID" scsi0 "$DISK"
qm set "$ID" --ide2 "${STORAGE}:cloudinit" --boot order=scsi0
qm set "$ID" --ipconfig0 "$IPCONFIG" --cicustom "user=local:snippets/$(basename "$SNIPPET")"
qm start "$ID"
echo "▶ VM started. Installation runs inside the VM for a few minutes."
if [[ -n "$IP" ]]; then
  echo "   Open http://${IP%/*}:3000 when it is done (ssh ${USER}@${IP%/*}; cat /var/log/reportforge-install.done)"
else
  echo "   DHCP: find the address with:  qm guest cmd $ID network-get-interfaces | grep -o 'ip-address.: .[0-9.]*' | grep -v 127.0.0.1"
  echo "   (the guest agent reports it ~1 minute after boot), then open http://<ip>:3000"
fi
