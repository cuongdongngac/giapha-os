import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPreRegisteredUser } from "./isPreRegisteredUser.ts";

// Đăng nhập Google chỉ dành cho email đã được admin tạo trước.
// Supabase gắn providers ["email"] cho tài khoản tạo bằng email,
// và thêm "google" khi email đó đăng nhập bằng Google lần đầu.
describe("isPreRegisteredUser", () => {
  it("từ chối tài khoản Google mới (chưa được admin tạo)", () => {
    assert.equal(
      isPreRegisteredUser({ app_metadata: { providers: ["google"] } }),
      false,
    );
  });

  it("chấp nhận email đã có khi đăng nhập bằng Google (đã liên kết)", () => {
    assert.equal(
      isPreRegisteredUser({ app_metadata: { providers: ["email", "google"] } }),
      true,
    );
  });

  it("chấp nhận tài khoản email/mật khẩu", () => {
    assert.equal(
      isPreRegisteredUser({ app_metadata: { providers: ["email"] } }),
      true,
    );
  });

  it("từ chối provider lạ không kèm email", () => {
    assert.equal(
      isPreRegisteredUser({ app_metadata: { providers: ["github"] } }),
      false,
    );
  });

  it("từ chối khi thiếu thông tin user", () => {
    assert.equal(isPreRegisteredUser(null), false);
    assert.equal(isPreRegisteredUser(undefined), false);
    assert.equal(isPreRegisteredUser({}), false);
    assert.equal(isPreRegisteredUser({ app_metadata: null }), false);
    assert.equal(isPreRegisteredUser({ app_metadata: {} }), false);
    assert.equal(
      isPreRegisteredUser({ app_metadata: { providers: null } }),
      false,
    );
  });
});
