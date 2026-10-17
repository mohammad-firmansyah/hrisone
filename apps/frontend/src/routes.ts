import { createBrowserRouter } from "react-router";
import { App } from "./App";
import { LoginPage } from "./page/LoginPage";
import { AdminPage } from "./page/AdminPage";
import { EmployeeMasterPage } from "./page/EmployeeMasterPage";
import { AttendancePage } from "./page/AttendancePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: LoginPage },
      { path: "admin", Component: EmployeeMasterPage },
      { path: "admin/employees", Component: EmployeeMasterPage },
      { path: "admin/attendance", Component: AdminPage },
      { path: "attendance", Component: AttendancePage },
    ],
  },
]);