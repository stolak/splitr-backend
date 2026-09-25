import { Request, Response } from "express";
import { taxMatrixService } from "../services/taxMatrixService";

export class TaxMatrixController {
  private ok(res: Response, data: unknown, message?: string, status = 200) {
    return res.status(status).json({
      success: true,
      ...(message ? { message } : {}),
      data,
    });
  }

  private fail(res: Response, error: any) {
    const message = error?.message || "Internal server error";
    const status = /not found/i.test(message)
      ? 404
      : /required|must be|already exists|at least one/i.test(message)
        ? 400
        : 500;

    if (status === 500) {
      console.error(error);
    }

    return res.status(status).json({ success: false, message });
  }

  async list(_req: Request, res: Response) {
    try {
      return this.ok(res, await taxMatrixService.list());
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getByProvinceCode(req: Request, res: Response) {
    try {
      const data = await taxMatrixService.getByProvinceCode(req.params.provinceCode);
      if (!data) {
        return res.status(404).json({ success: false, message: "Tax matrix not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await taxMatrixService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, message: "Tax matrix not found" });
      }
      return this.ok(res, data);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await taxMatrixService.create(req.body ?? {});
      return this.ok(res, data, "Tax matrix created successfully", 201);
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await taxMatrixService.update(req.params.id, req.body ?? {});
      return this.ok(res, data, "Tax matrix updated successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const data = await taxMatrixService.delete(req.params.id);
      return this.ok(res, data, "Tax matrix deleted successfully");
    } catch (error) {
      return this.fail(res, error);
    }
  }
}

export const taxMatrixController = new TaxMatrixController();
