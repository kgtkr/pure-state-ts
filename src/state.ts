import { Overwrite } from "type-zoo";

export type StateFn<S1 extends object, S2 extends object, T> = (state: S1) => [T, S2];

export function state<S1 extends object, S2 extends object, T>(fn: StateFn<S1, S2, T>): State<S1, S2, T> {
  return new State(fn);
}

export class State<S1 extends object, S2 extends object, T>{
  constructor(private readonly fn: StateFn<S1, S2, T>) {
  }

  static pure<S extends object, T>(x: T): State<S, S, T> {
    return new State(s => [x, s]);
  }

  run(state: S1): [T, S2] {
    return this.fn(state);
  }

  map<P>(f: (x: T) => P): State<S1, S2, P> {
    return new State(s1 => {
      const [res, s2] = this.fn(s1);
      return [f(res), s2];
    });
  }

  then<A extends object, P>(f: (x: T) => State<S2, A, P>): State<S1, A, P> {
    return new State<S1, A, P>(s => {
      const [a, newState] = this.fn(s);
      return f(a).fn(newState);
    });
  }

  static getAll<S extends object>(): State<S, S, S> {
    return new State(s => [s, s]);
  }

  static get<S extends object, K extends keyof S>(key: K): State<S, S, S[K]> {
    return new State(s => [s[key], s]);
  }

  static putAll<S extends object>(x: S): State<S, S, null> {
    return new State(_s => [null, x]);
  }

  static put<S extends object, K extends string, T>(key: K, x: T): State<S, Overwrite<S, { [P in K]: T }>, null> {
    return new State(s => [null, { ...s, [key]: x }]) as any;
  }
}
