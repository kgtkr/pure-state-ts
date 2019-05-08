import { State } from "./state";

describe("State", () => {
  describe("state", () => {
    it("state", () => {
      const st = State.state<{ x: number }, string>(s => [s.x.toString(), { ...s, x: s.x + 1 }]);
      expect(st.run({ x: 3 })).toEqual(["3", { x: 4 }]);
    });
  });

  describe("map", () => {
    it("map", () => {
      const st = State.state<{}, number>(s => [1, s])
        .map(x => x + 1);
      expect(st.run({})).toEqual([2, {}]);
    });
  });

  describe("then", () => {
    it("then", () => {
      const st = State.state<{ x: number }, string>(s => ["s", s])
        .then(x => State.state(s => [x + s.x, { ...s, x: s.x + 1 }]));

      expect(st.run({ x: 1 })).toEqual(["s1", { x: 2 }]);
    });
  });

  describe("getAll", () => {
    it("getAll", () => {
      const st = State.getAll<{ x: number }>();
      expect(st.run({ x: 2 })).toEqual([{ x: 2 }, { x: 2 }]);
    });
  });

  describe("get", () => {
    it("get", () => {
      const st = State.get<{ x: number, y: string }, "y">("y");
      expect(st.run({ x: 0, y: "" })).toEqual(["", { x: 0, y: "" }]);
    });
  });

  describe("putAll", () => {
    it("putAll", () => {
      const st = State.putAll<{ x: number }>({ x: 1 });
      expect(st.run({ x: 0 })).toEqual([null, { x: 1 }]);
    });
  });

  describe("put", () => {
    it("put", () => {
      const st = State.put<{ x: number, y: number }, "x">("x", 2);
      expect(st.run({ x: 0, y: 1 })).toEqual([null, { x: 2, y: 1 }]);
    });
  });

  describe("modifyAll", () => {
    it("modifyAll", () => {
      const st = State.modifyAll<{ x: number }>(x => ({ ...x, x: x.x * 10 }));
      expect(st.run({ x: 1 })).toEqual([null, { x: 10 }]);
    });
  });

  describe("modify", () => {
    it("modify", () => {
      const st = State.modify<{ x: number, y: number }, "x">("x", x => x * 10);
      expect(st.run({ x: 1, y: 2 })).toEqual([null, { x: 10, y: 2 }]);
    });
  });

  describe("defineAnd", () => {
    it("defineAnd", () => {
      const st = State.pure<{ x: string, y: string }, null>(null)
        .defineAnd(() => ({ y: 1, z: "c" }), State.state(s => [s.x.toUpperCase() + (s.y * 10) + s.z, s]));
      expect(st.run({ x: "a", y: "b" })).toEqual(["A10c", { x: "a", y: "b" }]);
    });
  });
});