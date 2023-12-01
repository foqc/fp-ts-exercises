import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as NEA from "fp-ts/NonEmptyArray";
import { Eq } from "fp-ts/Eq";
import * as TE from "fp-ts/TaskEither";

import axios from "axios";

type OneOrMany<T> =
  | { tag: "One"; value: T }
  | { tag: "Many"; value: NEA.NonEmptyArray<T> };

export const one = <T>(x: T): OneOrMany<T> => ({ tag: "One", value: x });
export const many = <T>(x: NEA.NonEmptyArray<T>): OneOrMany<T> => ({
  tag: "Many",
  value: x,
});

/* Build OneOrMany from a list
    fromList([]) // => O.none
    fromList([3]) // => O.some({ tag: "One", value: 3 })
    fromList([3, 4, 5]) // => O.some({ tag: "Many", value: [3, 4, 5] })
*/
export const fromList = <T>(x: T[]): O.Option<OneOrMany<T>> => {
  return pipe(
    x,
    NEA.fromArray,
    O.map((y) => {
      if (y.length === 1) {
        return one(y[0]);
      } else {
        return many(y);
      }
    })
  );
};

//Another way to do the same fromList function above
export const fromList2 = <T>(x: T[]): O.Option<OneOrMany<T>> => {
  if (x.length === 0) {
    return O.none;
  }

  if (x.length === 1) {
    return O.some(one(x[0]));
  }

  const result = O.getOrElse(() => NEA.of(x[0]))(NEA.fromArray(x));
  return O.some(many(result));
};

/* Checks equality of OneOrMany */
export const getEq = <T>(eqInner: Eq<T>): Eq<OneOrMany<T>> => ({
  equals: (x, y) => {
    if (x.tag === "One" && y.tag === "One") {
      return eqInner.equals(x.value, y.value);
    } else if (x.tag === "Many" && y.tag === "Many") {
      return NEA.getEq(eqInner).equals(x.value, y.value);
    }
    return false;
  },
});

/* Checks equality of OneOrMany */
export const map =
  <A, B>(f: (a: A) => B) =>
  (a: OneOrMany<A>): OneOrMany<B> => {
    switch (a.tag) {
      case "One":
        return one(f(a.value));
      case "Many":
        return pipe(a.value, NEA.map(f), many);
    }
  };

//Another way to do the same map function above
export const map2 =
  <A, B>(f: (a: A) => B) =>
  (a: OneOrMany<A>): OneOrMany<B> => {
    if (a.tag === "One") {
      return one(f(a.value));
    }
    return many(NEA.map(f)(a.value));
  };

type Tramite = {
  tramite_id: string;
  nombre: string;
};

/* Request ecuadorian procedures */
const URL = "https://www.gob.ec/api/v1/tramites";
export const printProceduresEC = (): void => {
  pipe(
    TE.tryCatch(
      async () => {
        const resp = await axios.get<Tramite[]>(URL);
        if (resp.status === 200) {
          return resp.data;
        } else {
          throw new Error(`Failed to get ${URL} with status ${resp.status}`);
        }
      },
      (x) => console.error((x as Error).message)
    ),
    TE.map((x) => x.forEach((y) => console.log(y.nombre)))
  )();
};

//Another way to do the same printProceduresEC function above
export const printProceduresEC2 = (): void => {
  const result = TE.tryCatch(
    async () => {
      const resp = await axios.get<Tramite[]>(URL);
      if (resp.status === 200) {
        return resp.data;
      }
      throw new Error(`Failed to get ${URL} with status ${resp.status}`);
    },
    (x) => console.error((x as Error).message)
  );

  const f = (x: Tramite[]) => x.forEach((y) => console.log(y.nombre));
  TE.map(f)(result)();
};
