import { describe, expect, it } from "vitest";
import { fitPath, fitText, textWidth } from "../src/modules/text/service";

describe("terminal text", () => {
  it("retains the filename and recognizable directory prefix", () => {
    expect(fitPath("assets/very-long-directory/vendor.js", 24)).toBe(
      "assets/very-l…/vendor.js",
    );
  });

  it("uses available width instead of truncating all paths at 28 characters", () => {
    const path = "assets/components/settings/index.js";
    expect(fitPath(path, 60)).toBe(path);
  });

  it("measures wide characters, combining accents, and emoji as terminal cells", () => {
    expect(textWidth("界面")).toBe(4);
    expect(textWidth("cafe\u0301")).toBe(4);
    expect(textWidth("👩‍💻")).toBe(2);
    expect(fitText("界面abc", 5)).toBe("界面…");
  });

  it("does not split a filename's emoji or combining character", () => {
    expect(fitText("👩‍💻abcd", 4)).toBe("👩‍💻a…");
    expect(fitText("cafe\u0301abcd", 5)).toBe("cafe\u0301…");
  });

  it("renders control characters in filenames without changing the terminal", () => {
    expect(fitPath("foo\n\u001b[2J.js", 40)).toBe("foo??[2J.js");
  });
});
