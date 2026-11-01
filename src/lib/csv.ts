export function csv(rows: (string | number | null | undefined)[][]) {
  const body = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(";")
    )
    .join("\r\n");
  return "\uFEFF" + body;
}

export function csvResponse(filename: string, rows: (string | number | null | undefined)[][]) {
  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
