import { State } from "./state";

describe("State", () => {
  describe("new", () => {
    it("正常に生成できるか", () => {
      const st = new State<{ x: number }, string>(s => [s.x.toString(), { ...s, x: s.x + 1 }]);
      expect(st.run({ x: 3 })).toEqual(["3", { x: 4 }]);
    });
  });
});