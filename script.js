let tableMapping = {};

// Hàm đọc file Excel và tạo bảng mapping
function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});

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

// Hàm đọc file SQL và hiển thị nội dung
function readSqlFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const sqlContent = e.target.result;

      // Hiển thị nội dung SQL ban đầu
      document.getElementById("uatSql").textContent = sqlContent;

      resolve(sqlContent);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Xử lý khi chọn file Excel
document.getElementById('excelFile').addEventListener('change', function () {
  const excelFile = this.files[0];
  if (excelFile) {
    readExcel(excelFile);
  }
});

// Xử lý khi chọn file SQL
document.getElementById('sqlFile').addEventListener('change', function () {
  const sqlFile = this.files[0];
  if (sqlFile) {
    readSqlFile(sqlFile);
  }
});

// Hàm xử lý khi người dùng nhấn "Chuyển đổi"
const TABLE_PREFIX = 'BPM_CDC_';

async function processFiles() {
  const sqlFile = document.getElementById('sqlFile').files[0];

  if (!sqlFile) {
    alert("Vui lòng chọn file SQL.");
    return;
  }

  try {
    // Bước 2: Đọc file SQL và thay thế theo mapping
    const convertedSql = await readSqlFile(sqlFile).then(sqlContent => {
      // Thay thế bảng UAT bằng bảng PROD dựa trên mapping
      for (const [uatTable, prodTable] of Object.entries(tableMapping)) {
        const regex = new RegExp(TABLE_PREFIX + uatTable, 'g'); // Sử dụng regex để thay thế toàn bộ
        sqlContent = sqlContent.replace(regex, TABLE_PREFIX + prodTable);
      }
      return sqlContent;
    });

    // Hiển thị nội dung SQL sau khi chuyển đổi
    document.getElementById("prodSql").textContent = convertedSql;

    // Bước 3: Tải xuống file SQL đã chuyển đổi
    downloadFile(convertedSql, "script_prod.txt");
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error);
  }
}

// Hàm tải xuống file
function downloadFile(content, fileName) {
  const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

// Thêm hàm mới để chuyển đổi SQL từ PROD sang UAT
function convertProdToUat(sqlContent) {
  for (const [uatTable, prodTable] of Object.entries(tableMapping)) {
    const regex = new RegExp(TABLE_PREFIX + prodTable, 'g');
    sqlContent = sqlContent.replace(regex, TABLE_PREFIX + uatTable);
  }
  return sqlContent;
}

// Hàm xử lý khi người dùng nhấn "Chuyển đổi PROD sang UAT"
async function processProdToUat() {
  const prodSqlInput = document.getElementById('prodSqlInput').value;
  const excelFile = document.getElementById('excelFile').files[0];

  if (!prodSqlInput) {
    alert("Vui lòng nhập script SQL PROD.");
    return;
  }

  if (!excelFile) {
    alert("Vui lòng chọn file Excel mapping.");
    return;
  }

  try {
    // Đọc file Excel mapping
    await readExcel(excelFile);

    // Hiển thị nội dung SQL PROD ban đầu
    document.getElementById("prodSql").textContent = prodSqlInput;

    // Chuyển đổi SQL từ PROD sang UAT
    const convertedUatSql = convertProdToUat(prodSqlInput);

    // Hiển thị nội dung SQL sau khi chuyển đổi sang UAT
    document.getElementById("uatSql").textContent = convertedUatSql;

    // Tải xuống file SQL đã chuyển đổi
    downloadFile(convertedUatSql, "script_uat.txt");
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error);
  }
}
