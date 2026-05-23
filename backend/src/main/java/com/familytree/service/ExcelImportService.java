package com.familytree.service;

import com.familytree.model.*;
import com.familytree.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelImportService {

    private final PersonRepository personRepository;
    private final FamilyTreeRepository treeRepository;
    private final FamilyTreeService treeService;

    /**
     * Expected Excel columns:
     * A: row_id (temporary, for referencing parent/spouse)
     * B: firstName
     * C: lastName
     * D: gender (MALE/FEMALE)
     * E: birthDate (yyyy-MM-dd or date cell)
     * F: deathDate (yyyy-MM-dd or date cell, optional)
     * G: bio (optional)
     * H: father_row_id (optional, references column A)
     * I: mother_row_id (optional, references column A)
     * J: spouse_row_id (optional, references column A)
     * K: generation (optional, integer)
     * L: englishName (optional)
     * M: phone (optional)
     * N: email (optional)
     * O: country (optional)
     * P: province (optional)
     * Q: city (optional)
     */
    @Transactional
    public int importFromExcel(UUID treeId, MultipartFile file, UUID userId) {
        treeService.checkAdminAccess(userId, treeId);

        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new RuntimeException("Family tree not found"));

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Person> rowIdToPersonMap = new LinkedHashMap<>();
            Map<String, String[]> relationshipsMap = new LinkedHashMap<>();

            // First pass: create all persons
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String rowId = getStringValue(row.getCell(0));
                if (rowId == null || rowId.isBlank()) continue;

                String firstName = getStringValue(row.getCell(1));
                if (firstName == null || firstName.isBlank()) continue;

                Person person = Person.builder()
                        .familyTree(tree)
                        .firstName(firstName)
                        .lastName(getStringValue(row.getCell(2)))
                        .gender(parseGender(getStringValue(row.getCell(3))))
                        .birthDate(parseDateCell(row.getCell(4)))
                        .deathDate(parseDateCell(row.getCell(5)))
                        .bio(getStringValue(row.getCell(6)))
                        .generation(parseIntCell(row.getCell(10), 0))
                        .englishName(getStringValue(row.getCell(11)))
                        .phone(getStringValue(row.getCell(12)))
                        .email(getStringValue(row.getCell(13)))
                        .country(getStringValue(row.getCell(14)))
                        .province(getStringValue(row.getCell(15)))
                        .city(getStringValue(row.getCell(16)))
                        .build();

                person = personRepository.save(person);
                rowIdToPersonMap.put(rowId, person);

                String fatherRowId = getStringValue(row.getCell(7));
                String motherRowId = getStringValue(row.getCell(8));
                String spouseRowId = getStringValue(row.getCell(9));
                relationshipsMap.put(rowId, new String[]{fatherRowId, motherRowId, spouseRowId});
            }

            // Second pass: set relationships
            for (Map.Entry<String, String[]> entry : relationshipsMap.entrySet()) {
                Person person = rowIdToPersonMap.get(entry.getKey());
                String[] rels = entry.getValue();

                if (rels[0] != null && rowIdToPersonMap.containsKey(rels[0])) {
                    person.setFather(rowIdToPersonMap.get(rels[0]));
                }
                if (rels[1] != null && rowIdToPersonMap.containsKey(rels[1])) {
                    person.setMother(rowIdToPersonMap.get(rels[1]));
                }
                if (rels[2] != null && rowIdToPersonMap.containsKey(rels[2])) {
                    Person spouse = rowIdToPersonMap.get(rels[2]);
                    person.setSpouse(spouse);
                    spouse.setSpouse(person);
                    personRepository.save(spouse);
                }
                personRepository.save(person);
            }

            return rowIdToPersonMap.size();

        } catch (Exception e) {
            log.error("Excel import failed", e);
            throw new RuntimeException("Failed to import Excel: " + e.getMessage());
        }
    }

    private String getStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
            default -> null;
        };
    }

    private LocalDate parseDateCell(Cell cell) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant()
                        .atZone(ZoneId.systemDefault()).toLocalDate();
            }
            if (cell.getCellType() == CellType.STRING) {
                String val = cell.getStringCellValue().trim();
                if (!val.isEmpty()) return LocalDate.parse(val);
            }
        } catch (Exception e) {
            log.warn("Could not parse date cell: {}", e.getMessage());
        }
        return null;
    }

    private int parseIntCell(Cell cell, int defaultValue) {
        if (cell == null) return defaultValue;
        try {
            if (cell.getCellType() == CellType.NUMERIC) return (int) cell.getNumericCellValue();
            if (cell.getCellType() == CellType.STRING) return Integer.parseInt(cell.getStringCellValue().trim());
        } catch (Exception ignored) {}
        return defaultValue;
    }

    private Person.Gender parseGender(String value) {
        if (value == null) return null;
        return switch (value.toUpperCase()) {
            case "MALE", "M", "男" -> Person.Gender.MALE;
            case "FEMALE", "F", "女" -> Person.Gender.FEMALE;
            default -> null;
        };
    }
}
