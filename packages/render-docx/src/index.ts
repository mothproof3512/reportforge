import type { Modules, ReportContext } from '@reportforge/core';
export async function renderDocx(mods: Modules, ctx: ReportContext, outDocx: string): Promise<{ docx: string; warnings: string[] }> {
  throw new Error('DOCX renderer nog niet geïmplementeerd');
}
