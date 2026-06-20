import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";

vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div className={className} data-testid="spinner">Loading</div>
  ),
}));

afterEach(() => cleanup());

// --- getToolCallLabel ---

test("str_replace_editor create returns Creating {path}", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" }))
    .toBe("Creating /App.jsx");
});

test("str_replace_editor str_replace returns Editing {path}", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" }))
    .toBe("Editing /components/Card.jsx");
});

test("str_replace_editor insert returns Editing {path}", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/utils/helpers.ts" }))
    .toBe("Editing /utils/helpers.ts");
});

test("str_replace_editor view returns Viewing {path}", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/index.html" }))
    .toBe("Viewing /index.html");
});

test("str_replace_editor undo_edit returns Undoing edit to {path}", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }))
    .toBe("Undoing edit to /App.jsx");
});

test("file_manager rename returns Renaming {path}", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/old.jsx" }))
    .toBe("Renaming /old.jsx");
});

test("file_manager delete returns Deleting {path}", () => {
  expect(getToolCallLabel("file_manager", { command: "delete", path: "/trash.jsx" }))
    .toBe("Deleting /trash.jsx");
});

test("unknown tool falls back to tool name", () => {
  expect(getToolCallLabel("web_search", { query: "react hooks" }))
    .toBe("web_search");
});

test("known tool with unknown command falls back to tool name", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "frobnicate", path: "/x.ts" }))
    .toBe("str_replace_editor");
});

test("missing path produces label with empty path segment", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create" }))
    .toBe("Creating ");
});

// --- ToolCallBadge rendering ---

test("shows spinner when state is call", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "create", path: "/App.jsx" }}
    />
  );
  expect(screen.getByTestId("spinner")).toBeDefined();
});

test("shows green dot and no spinner when state is result with truthy result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "create", path: "/App.jsx" }}
      result="Success"
    />
  );
  expect(screen.queryByTestId("spinner")).toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("shows spinner when state is result but result is null", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "create", path: "/App.jsx" }}
      result={null}
    />
  );
  expect(screen.getByTestId("spinner")).toBeDefined();
});

test("displays human-friendly label not raw tool name", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "str_replace", path: "/components/Card.jsx" }}
      result="ok"
    />
  );
  expect(screen.getByText("Editing /components/Card.jsx")).toBeDefined();
  expect(screen.queryByText("str_replace_editor")).toBeNull();
});

test("displays raw tool name as fallback for unknown tool", () => {
  render(
    <ToolCallBadge
      toolName="unknown_tool"
      state="call"
      args={{}}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("badge wrapper has correct styling classes", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="file_manager"
      state="call"
      args={{ command: "delete", path: "/x.jsx" }}
    />
  );
  const wrapper = container.firstChild as HTMLElement;
  expect(wrapper.className).toContain("inline-flex");
  expect(wrapper.className).toContain("items-center");
  expect(wrapper.className).toContain("bg-neutral-50");
  expect(wrapper.className).toContain("rounded-lg");
  expect(wrapper.className).toContain("border-neutral-200");
});
