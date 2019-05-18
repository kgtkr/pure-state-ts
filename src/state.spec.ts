import { ObjectState } from "./state";

describe("State", () => {
  describe("state", () => {
    it("state", () => {
      const st = ObjectState.state<{ x: number }, string>(s => [s.x.toString(), { ...s, x: s.x + 1 }]);
      expect(st.run({ x: 3 })).toEqual(["3", { x: 4 }]);
    });
  });

  describe("map", () => {
    it("map", () => {
      const st = ObjectState.state<{}, number>(s => [1, s])
        .map(x => x + 1);
      expect(st.run({})).toEqual([2, {}]);
    });
  });

  describe("then", () => {
    it("then", () => {
      const st = ObjectState.state<{ x: number }, string>(s => ["s", s])
        .then(x => ObjectState.state(s => [x + s.x, { ...s, x: s.x + 1 }]));

      expect(st.run({ x: 1 })).toEqual(["s1", { x: 2 }]);
    });
  });

  describe("getAll", () => {
    it("getAll", () => {
      const st = ObjectState.getAll<{ x: number }>();
      expect(st.run({ x: 2 })).toEqual([{ x: 2 }, { x: 2 }]);
    });
  });

  describe("get", () => {
    it("get", () => {
      const st = ObjectState.get<{ x: number, y: string }, "y">("y");
      expect(st.run({ x: 0, y: "" })).toEqual(["", { x: 0, y: "" }]);
    });
  });

  describe("putAll", () => {
    it("putAll", () => {
      const st = ObjectState.putAll<{ x: number }>({ x: 1 });
      expect(st.run({ x: 0 })).toEqual([null, { x: 1 }]);
    });
  });

  describe("put", () => {
    it("put", () => {
      const st = ObjectState.put<{ x: number, y: number }, "x">("x", 2);
      expect(st.run({ x: 0, y: 1 })).toEqual([null, { x: 2, y: 1 }]);
    });
  });

  describe("modifyAll", () => {
    it("modifyAll", () => {
      const st = ObjectState.modifyAll<{ x: number }>(x => ({ ...x, x: x.x * 10 }));
      expect(st.run({ x: 1 })).toEqual([null, { x: 10 }]);
    });
  });

  describe("modify", () => {
    it("modify", () => {
      const st = ObjectState.modify<{ x: number, y: number }, "x">("x", x => x * 10);
      expect(st.run({ x: 1, y: 2 })).toEqual([null, { x: 10, y: 2 }]);
    });
  });

  describe("defineAnd", () => {
    it("defineAnd", () => {
      const st = ObjectState.of<{ x: string, y: string }, null>(null)
        .defineAnd(() => ({ y: 1, z: "c" }), ObjectState.state(s => [s.x.toUpperCase() + (s.y * 10) + s.z, s]));
      expect(st.run({ x: "a", y: "b" })).toEqual(["A10c", { x: "a", y: "b" }]);
    });
  });

  describe("passAndThen", () => {
    it("passAndThen", () => {
      const addAndMul = (a: number) => ObjectState.modify<{ b: number, z: string }, "b">("b", b => a + b)
        .and(ObjectState.modify("z", z => z.toUpperCase()))
        .and(ObjectState.get("b"))
        .map(b => a * b);

      const st = ObjectState.of<{ x: number, y: number, z: string }, null>(null)
        .and(ObjectState.get("x"))
        .passAndThen(x => addAndMul(x), { b: "y", z: "z" });
      expect(st.run({ x: 2, y: 3, z: "a" })).toEqual([10, { x: 2, y: 5, z: "A" }]);
    });
  });
});