import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import { requireRole } from "@/middleware/auth";
import {
  addStudentSchema,
  classIdParams,
  createClassSchema,
  orgIdParams,
  patchOrgSchema,
  studentIdParams,
  type AddStudentInput,
  type CreateClassInput,
  type PatchOrgInput,
} from "./organization.schema";
import {
  createClass,
  createStudent,
  getOrganizationDashboard,
  getCapabilities,
  getOrganization,
  listClasses,
  listClassStudents,
  listStudents,
  listTeachers,
  patchOrganization,
  removeStudent,
} from "./organization.service";

export const organizationRouter: Router = Router();

// What this deployment can do (e.g. AI available?). Used by the UI to show/hide
// AI features and degrade gracefully (AGENTS §8).
organizationRouter.get("/capabilities", (_req, res) => {
  res.json(getCapabilities());
});

organizationRouter.get(
  "/organizations/:id",
  validate(orgIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await getOrganization(requireCtx(req), id));
  },
);

/** Organisation-wide operational counts are an admin concern. */
organizationRouter.get(
  "/organization/dashboard",
  requireRole("admin"),
  async (req, res) => {
    res.json(await getOrganizationDashboard(requireCtx(req)));
  },
);

organizationRouter.patch(
  "/organizations/:id",
  requireRole("admin"),
  validate(orgIdParams, "params"),
  validate(patchOrgSchema),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    const input = validated<PatchOrgInput>(req);
    res.json(await patchOrganization(requireCtx(req), id, input));
  },
);

organizationRouter.get(
  "/organizations/:id/teachers",
  requireRole("admin"),
  validate(orgIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await listTeachers(requireCtx(req), id));
  },
);

organizationRouter.get("/classes", async (req, res) => {
  res.json(await listClasses(requireCtx(req)));
});

organizationRouter.post("/classes", requireRole("admin"), validate(createClassSchema), async (req, res) => {
  const input = validated<CreateClassInput>(req);
  res.status(201).json(await createClass(requireCtx(req), input));
});

organizationRouter.get(
  "/classes/:id/students",
  validate(classIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await listClassStudents(requireCtx(req), id));
  },
);

organizationRouter.get("/students", async (req, res) => {
  res.json(await listStudents(requireCtx(req)));
});

organizationRouter.post("/students", requireRole("admin"), validate(addStudentSchema), async (req, res) => {
  const input = validated<AddStudentInput>(req);
  res.status(201).json(await createStudent(requireCtx(req), input));
});

organizationRouter.delete(
  "/students/:id",
  requireRole("admin"),
  validate(studentIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await removeStudent(requireCtx(req), id));
  },
);
