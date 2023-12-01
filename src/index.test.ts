import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import { Eq } from "fp-ts/string";

import * as OM from ".";

describe("OM.fromList", () => {
  describe("given empty list", () => {
    it("returns O.none", () => {
      const result = OM.fromList([]);
      expect(result).toEqual(O.none);
    });
  });

  describe("given a list with a single elemnt", () => {
    it("returns O.some(One(...))", () => {
      const result = OM.fromList([1]);
      expect(
        result._tag === "Some" &&
          result.value.tag === "One" &&
          result.value.value === 1
      ).toBeTruthy();
    });
  });

  describe("given a list with a multiple items", () => {
    it("returns O.some(Many(...))", () => {
      const result = OM.fromList([1, 2, 3]);
      expect(
        result._tag === "Some" &&
          result.value.tag === "Many" &&
          A.size(result.value.value) === 3
      ).toBeTruthy();
    });
  });
});

describe("getEq instance", () => {
  const exampleOneNE = pipe(["hey", "you"], A.append("!"));
  const exampleTwoNE = pipe(
    ["how", "I", "wish", "you", "were"],
    A.append("here")
  );

  const eqStringOM = OM.getEq(Eq);

  describe("given the Eq instance of String", () => {
    it("returns True for two One's with equal strings inside", () => {
      expect(eqStringOM.equals(OM.one("Hello"), OM.one("Hello"))).toBeTruthy();
    });

    it("returns False for two One's with no equal strings inside", () => {
      expect(eqStringOM.equals(OM.one("Hello"), OM.one("World"))).toBeFalsy();
    });

    it("returns True for two Many's with equal strings inside", () => {
      expect(
        eqStringOM.equals(OM.many(exampleOneNE), OM.many(exampleOneNE))
      ).toBeTruthy();
    });

    it("returns False for two Many's with not equal strings inside", () => {
      expect(
        eqStringOM.equals(OM.many(exampleOneNE), OM.many(exampleTwoNE))
      ).toBeFalsy();
    });

    it("returns False if one is one and the other is many", () => {
      expect(
        eqStringOM.equals(OM.one("hey"), OM.many(exampleOneNE))
      ).toBeFalsy();
    });
  });
});

describe("map", () => {
  const eqStringOM = OM.getEq(Eq);
  const f = (x: string) => x + " " + x;

  it("applies f to value inside one", () => {
    expect(
      pipe(OM.one("hello"), OM.map(f), (x) =>
        eqStringOM.equals(x, OM.one("hello hello"))
      )
    ).toBeTruthy();
  });

  it("applies f to value inside many", () => {
    const actualOM = pipe(["hey", "you"], A.append("!"), OM.many);
    const expectedOM = pipe(["hey hey", "you you"], A.append("! !"), OM.many);
    expect(
      pipe(actualOM, OM.map(f), (x) => eqStringOM.equals(x, expectedOM))
    ).toBeTruthy();
  });
});
