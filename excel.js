'use strict';
// Builds the jury's Excel report: a styled results sheet and a per-question answers sheet.
const ExcelJS = require('exceljs');

const TITLE_KK = '«Экономикалық альянс: педагог және студенттер» облыстық чемпионаты';
const TITLE_RU = 'Областной чемпионат «Экономический альянс: педагог и студенты»';
const LEVELS = {
  high: ['Высокий уровень', 'Жоғары деңгей'], good: ['Хороший уровень', 'Жақсы деңгей'],
  basic: ['Базовый уровень', 'Базалық деңгей'], repeat: ['Требуется повторение', 'Қайталау қажет'],
};
const VIOLET = 'FF4A37C9', VIOLET_LIGHT = 'FFF1EFFF', TEAL_LIGHT = 'FFE1F8F2', GREY = 'FF6B7190', BORDER = 'FFD9D6F0';
const MEDAL = ['FFFFE8A3', 'FFE9ECF3', 'FFF6DCC8'];
const thin = { style: 'thin', color: { argb: BORDER } };
const box = { top: thin, left: thin, bottom: thin, right: thin };
const TZ = 'Asia/Almaty';
const fmt = iso => (iso ? new Date(iso).toLocaleString('ru-RU', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

function titleBlock(ws, lastCol, subtitle) {
  const rows = [[TITLE_KK, 15, true, VIOLET], [TITLE_RU, 13, true, VIOLET], [subtitle, 10, false, GREY]];
  rows.forEach(([text, size, bold, color], i) => {
    const r = i + 1;
    ws.mergeCells(r, 1, r, lastCol);
    const c = ws.getCell(r, 1);
    c.value = text;
    c.font = { name: 'Calibri', size, bold, color: { argb: color } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws.getRow(r).height = i === 2 ? 20 : 30;
  });
  ws.getRow(4).height = 8;
}
function header(ws, rowNo, labels) {
  const row = ws.getRow(rowNo);
  labels.forEach((t, i) => {
    const c = row.getCell(i + 1);
    c.value = t;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VIOLET } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = box;
  });
  row.height = 36;
}

// teams: [{ slot, name, enteredAt, quiz: { score, total, level, finishedAt, answers, questions } | null }], ranking: [{ slot }]
async function buildReport({ teams, ranking, round }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Economic Relay'; wb.created = new Date();
  const subtitle = `Мұғалімдер тесті / Тест для преподавателей · Тур ${round} · ${fmt(new Date().toISOString())}`;

  // ---- sheet 1: results ----
  const ws = wb.addWorksheet('Нәтижелер · Результаты', { views: [{ state: 'frozen', ySplit: 5 }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 } });
  ws.columns = [{ width: 8 }, { width: 26 }, { width: 38 }, { width: 28 }, { width: 10 }, { width: 8 }, { width: 9 }, { width: 24 }, { width: 17 }, { width: 17 }];
  titleBlock(ws, 10, subtitle);
  header(ws, 5, ['Орын\nМесто', 'Команда', 'Колледж', 'Жетекші\nРуководитель', 'Балл', 'Барлығы\nИз', '%', 'Деңгей / Уровень', 'Бастады\nНачали', 'Аяқтады\nЗавершили']);
  const bySlot = new Map(teams.map(t => [t.slot, t]));
  let place = 0;
  ranking.forEach((r, i) => {
    const t = bySlot.get(r.slot), q = t.quiz, rowNo = 6 + i;
    if (q) place++;
    const row = ws.getRow(rowNo);
    const medal = q && place <= 3 ? ['🥇 ', '🥈 ', '🥉 '][place - 1] : '';
    row.values = [q ? `${medal}${place}` : '—', t.name, t.college || '', t.leader || '', q ? q.score : (t.enteredAt ? 'тапсыруда / проходят тест' : 'бастамады / не начали'), q ? q.total : '', q ? q.score / q.total : '', q ? `${LEVELS[q.level][1]} / ${LEVELS[q.level][0]}` : '', fmt(t.enteredAt), fmt(q?.finishedAt)];
    if (!q) ws.mergeCells(rowNo, 5, rowNo, 7);
    row.height = 34;
    row.eachCell({ includeEmpty: true }, (c, col) => {
      c.border = box;
      c.alignment = { vertical: 'middle', horizontal: [2, 3, 4, 8].includes(col) ? 'left' : 'center', wrapText: true };
      c.font = { size: col === 3 || col === 4 ? 10 : 11, bold: col <= 2 || col === 5, color: { argb: q ? 'FF1D1B45' : GREY } };
      const fill = q && place <= 3 ? MEDAL[place - 1] : i % 2 ? VIOLET_LIGHT : 'FFFFFFFF';
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    });
    if (q) ws.getCell(rowNo, 7).numFmt = '0%';
  });
  const end = 6 + ranking.length;
  const done = teams.filter(t => t.quiz);
  ws.mergeCells(end + 1, 1, end + 1, 10);
  const sum = ws.getCell(end + 1, 1);
  sum.value = done.length
    ? `Тест тапсырды / Прошли тест: ${done.length} из ${teams.length} · Орташа нәтиже / Средний результат: ${Math.round(done.reduce((a, t) => a + t.quiz.score / t.quiz.total, 0) / done.length * 100)}%`
    : `Тест әлі тапсырылмады / Тест ещё не проходили (${teams.length} команд)`;
  sum.font = { italic: true, color: { argb: GREY } };
  sum.alignment = { horizontal: 'left' };
  ws.getRow(end + 1).height = 22;

  // ---- sheet 2: answers per question ----
  const qs = done[0]?.quiz.questions || [];
  const wa = wb.addWorksheet('Жауаптар · Ответы', { views: [{ state: 'frozen', xSplit: 2, ySplit: 5 }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 } });
  const n = Math.max(qs.length, ...done.map(t => t.quiz.total), 1);
  wa.columns = [{ width: 6 }, { width: 40 }, ...Array.from({ length: n }, () => ({ width: 5 })), { width: 9 }];
  titleBlock(wa, n + 3, 'Әр сұрақ бойынша жауаптар / Ответы по каждому вопросу: ✓ — дұрыс / верно, ✗ — қате / неверно');
  header(wa, 5, ['№', 'Команда', ...Array.from({ length: n }, (_, i) => String(i + 1)), 'Балл']);
  teams.forEach((t, i) => {
    const q = t.quiz, rowNo = 6 + i, row = wa.getRow(rowNo);
    row.getCell(1).value = t.slot; row.getCell(2).value = t.college ? `${t.name}\n${t.college}` : t.name;
    for (let k = 0; k < n; k++) {
      const c = row.getCell(3 + k);
      if (q && k < q.total) {
        const ok = q.answers[k] === (q.questions || qs)[k]?.correct;
        c.value = ok ? '✓' : '✗';
        c.font = { bold: true, color: { argb: ok ? 'FF0B8A77' : 'FFC23A57' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ok ? TEAL_LIGHT : 'FFFDECEF' } };
      }
    }
    row.getCell(n + 3).value = q ? `${q.score}/${q.total}` : '—';
    row.height = t.college ? 34 : 22;
    row.eachCell({ includeEmpty: true }, (c, col) => { c.border = box; c.alignment = { horizontal: col === 2 ? 'left' : 'center', vertical: 'middle', wrapText: col === 2 }; if (col <= 2 || col === n + 3) c.font = { bold: col !== 1, color: { argb: 'FF1D1B45' } }; });
  });
  if (qs.length) {
    const start = 8 + teams.length;
    wa.getCell(start, 1).value = 'Сұрақтар / Вопросы'; wa.getCell(start, 1).font = { bold: true, color: { argb: VIOLET } };
    qs.forEach((q, i) => {
      const r = start + 1 + i;
      wa.getCell(r, 1).value = i + 1;
      wa.mergeCells(r, 2, r, n + 3);
      wa.getCell(r, 2).value = `${q.kk} / ${q.ru}`;
      wa.getCell(r, 2).alignment = { wrapText: true, vertical: 'top' };
      wa.getRow(r).height = 30;
    });
  }
  return wb.xlsx.writeBuffer();
}

module.exports = { buildReport, TITLE_KK, TITLE_RU };
