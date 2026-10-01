import { expect, test } from "bun:test";
import { redactPii } from "@/lib/redact";

test("redacts documents, phones and emails, keeps the question", () => {
  expect(redactPii("mi dni es 45678912 y se perdió")).toBe(
    "mi dni es [documento] y se perdió",
  );
  expect(redactPii("dni 45678912-3")).toBe("dni [documento]");
  expect(redactPii("mi ruc 10456789123")).toBe("mi ruc [ruc]");
  expect(redactPii("llámame al 987 654 321 o +51 987654321")).toBe(
    "llámame al [teléfono] o [teléfono]",
  );
  expect(redactPii("escribe a ana.perez+1@gmail.com")).toBe(
    "escribe a [correo]",
  );
  expect(redactPii("cuánto cuesta el pasaporte 2026")).toBe(
    "cuánto cuesta el pasaporte 2026",
  );
  expect(redactPii("pago S/ 30.00 código 02121")).toBe(
    "pago S/ 30.00 código 02121",
  );
});
