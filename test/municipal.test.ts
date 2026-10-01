import { expect, test } from "bun:test";
import { municipalityName, needsDistrict } from "@/lib/municipal";

test("reads the place out of municipal entities", () => {
  expect(municipalityName("Municipalidad Distrital de Pacasmayo")).toBe(
    "Pacasmayo",
  );
  expect(municipalityName("Municipalidad Metropolitana de Lima")).toBe("Lima");
  expect(municipalityName("Municipalidad de Miraflores")).toBe("Miraflores");
  expect(
    municipalityName("Registro Nacional de Identificación y Estado Civil"),
  ).toBeUndefined();
});

test("asks for the district unless the person already named it", () => {
  expect(
    needsDistrict(
      "Municipalidad Distrital de Pacasmayo",
      "quiero abrir una bodega",
    ),
  ).toBe("Pacasmayo");
  expect(
    needsDistrict(
      "Municipalidad Distrital de Pacasmayo",
      "bodega en pacasmayo",
    ),
  ).toBeUndefined();
  expect(
    needsDistrict("Superintendencia Nacional de Migraciones", "pasaporte"),
  ).toBeUndefined();
});
