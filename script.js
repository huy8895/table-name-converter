// Thêm các hằng số đầu file
let tableMapping = {};

// Hàm load mapping từ file JSON
async function loadMapping() {
  try {
    const response = await fetch('mapping.json');
    if (!response.ok) throw new Error('Không tìm thấy file mapping');
    const data = await response.json();
    
    // Chuẩn hóa dữ liệu
    tableMapping = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,value 
      ])
    );
    
    renderMappingTable();
  } catch (error) {
    console.error('Lỗi khi load mapping:', error);
    alert('Không thể load dữ liệu mapping. Vui lòng kiểm tra file mapping.json');
  }
}

// Hàm xử lý khi người dùng nhấn "Chuyển đổi"
const TABLE_PREFIX = 'BPM_CDC_';



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

// Hàm mới để chuyển đổi SQL từ UAT sang PROD
function convertUatToProd(sqlContent) {
  console.log('convertUatToProd', sqlContent)
  for (const [uatTable, prodTable] of Object.entries(tableMapping)) {
    console.log('uattable: ', uatTable)
    const regex = new RegExp(TABLE_PREFIX + uatTable, 'g');
    sqlContent = sqlContent.replace(regex, TABLE_PREFIX + prodTable);
  }
  console.log('convertUatToProd end', sqlContent)

  return sqlContent;
}

// Hàm xử lý khi người dùng nhấn "Chuyển đổi UAT sang PROD"
async function processUatToProd() {
  const uatSqlInput = document.getElementById('uatSqlInput').value;

  if (!uatSqlInput) {
    alert("Vui lòng nhập script SQL UAT.");
    return;
  }

  try {
    const convertedProdSql = convertUatToProd(uatSqlInput);
    document.getElementById("prodSql").textContent = convertedProdSql;
    downloadFile(convertedProdSql, "script_prod.txt");
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error);
  }
}



// Hàm hiển thị dữ liệu mapping
function renderMappingTable() {
  const outputTables = document.getElementById("outputTables");
  outputTables.innerHTML = ''; // Xóa nội dung cũ

  // Thêm header
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>UAT Table</th>
    <th>PROD Table</th>
  `;
  outputTables.appendChild(headerRow);

  // Thêm dữ liệu
  Object.entries(tableMapping).forEach(([uat, prod]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${uat.replace(TABLE_PREFIX, '')}</td>
      <td>${prod.replace(TABLE_PREFIX, '')}</td>
    `;
    outputTables.appendChild(row);
  });
}

// Khởi tạo load mapping khi trang web được tải
window.addEventListener('DOMContentLoaded', () => {
  loadMapping();
});