let tableMapping = {};

// Hàm đọc file Excel và tạo bảng mapping
function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const outputTables = document.getElementById("outputTables");
      outputTables.innerHTML = "";

      // Tạo mapping từ cột db uat sang db prod và hiển thị dữ liệu
      rows.forEach(row => {
        const uatTable = row[0];
        const prodTable = row[1];
        if (uatTable && prodTable) {
          tableMapping[uatTable] = prodTable;

          // Thêm dữ liệu vào bảng hiển thị
          const tr = document.createElement("tr");
          const tdUat = document.createElement("td");
          const tdProd = document.createElement("td");
          tdUat.textContent = uatTable;
          tdProd.textContent = prodTable;
          tr.appendChild(tdUat);
          tr.appendChild(tdProd);
          outputTables.appendChild(tr);
        }
      });

      resolve();
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Hàm đọc file SQL và chuyển đổi theo mapping
function readSqlFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      let sqlContent = e.target.result;

      // Hiển thị nội dung SQL ban đầu
      document.getElementById("uatSql").textContent = sqlContent;

      // Thay thế bảng UAT bằng bảng PROD dựa trên mapping
      for (const [uatTable, prodTable] of Object.entries(tableMapping)) {
        const regex = new RegExp(uatTable, 'g'); // Sử dụng regex để thay thế toàn bộ
        sqlContent = sqlContent.replace(regex, prodTable);
      }

      // Hiển thị nội dung SQL sau khi chuyển đổi
      document.getElementById("prodSql").textContent = sqlContent;

      resolve(sqlContent);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Hàm xử lý khi người dùng nhấn "Chuyển đổi"
async function processFiles() {
  const excelFile = document.getElementById('excelFile').files[0];
  const sqlFile = document.getElementById('sqlFile').files[0];

  if (!excelFile || !sqlFile) {
    alert("Vui lòng chọn cả file Excel và file SQL.");
    return;
  }

  try {
    // Bước 1: Đọc và tạo bảng mapping từ Excel
    await readExcel(excelFile);

    // Bước 2: Đọc file SQL và thay thế theo mapping
    const convertedSql = await readSqlFile(sqlFile);

    // Bước 3: Tải xuống file SQL đã chuyển đổi
    downloadFile(convertedSql, "script_prod.txt");
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error);
  }
}

// Hàm tải xuống file
function downloadFile(content, fileName) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}
