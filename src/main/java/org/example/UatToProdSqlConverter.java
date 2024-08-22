package org.example;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.*;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;

public class UatToProdSqlConverter {

  public static void main(String[] args) throws IOException {
    // Đường dẫn tới file Excel và file SQL
    String excelFilePath = "D:\\OneDrive - NGAN HANG TMCP HANG HAI VIET NAM (MSB)\\Documents\\1.CDC\\cdc_notes.xlsx";
    String uatSqlFilePath = "D:\\OneDrive - NGAN HANG TMCP HANG HAI VIET NAM (MSB)\\Documents\\1.CDC\\uat_sql.txt";
    String prodSqlFilePath = "D:\\OneDrive - NGAN HANG TMCP HANG HAI VIET NAM (MSB)\\Documents\\1.CDC\\script_prod.txt";

    // Bước 1: Đọc dữ liệu mapping từ file Excel
    Map<String, String> tableMapping = readExcelMapping(excelFilePath);

    // Bước 2: Đọc file uat_sql.txt
    String uatSqlContent = new String(Files.readAllBytes(Paths.get(uatSqlFilePath)));

    // Bước 3: Thay thế bảng UAT bằng bảng PROD dựa trên mapping
    String prodSqlContent = convertUatToProd(uatSqlContent, tableMapping);

    // Bước 4: Ghi kết quả vào file script_prod.txt
    Files.write(Paths.get(prodSqlFilePath), prodSqlContent.getBytes());

    System.out.println("Chuyển đổi thành công! Script đã được ghi vào file script_prod.txt");

  }

  private static Map<String, String> readExcelMapping(String excelFilePath) throws IOException {
    Map<String, String> tableMapping = new HashMap<>();

    try (FileInputStream fis = new FileInputStream(excelFilePath);
        Workbook workbook = new XSSFWorkbook(fis)) {

      Sheet sheet = workbook.getSheetAt(0); // Giả định dữ liệu mapping ở sheet đầu tiên

      for (Row row : sheet) {
        String uatTable = row.getCell(0)
            .getStringCellValue();
        String prodTable = row.getCell(1)
            .getStringCellValue();
        tableMapping.put(uatTable, prodTable);
      }
    }

    return tableMapping;
  }

  private static String convertUatToProd(String uatSqlContent, Map<String, String> tableMapping) {
    String prodSqlContent = uatSqlContent;

    // Thay thế từng bảng UAT bằng bảng PROD dựa trên mapping
    for (Map.Entry<String, String> entry : tableMapping.entrySet()) {
      prodSqlContent = prodSqlContent.replace(entry.getKey(), entry.getValue());
    }

    return prodSqlContent;
  }
}
