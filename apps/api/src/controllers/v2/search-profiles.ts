import { Request, Response } from "express";
import { z } from "zod";
import {
  SearchProfileInput,
  SearchProfileUpdateInput,
  createSearchProfile,
  getSearchProfile,
  updateSearchProfile,
} from "../../services/search-profiles";

const createProfileSchema = z.strictObject({
  profileId: z.string().max(128),
  name: z.string().max(256),
  allowlist: z.array(z.string()).min(1),
  denylist: z.array(z.string()).optional(),
  wildcardPolicy: z.enum(["none", "subdomains_only"]).optional(),
});

const updateProfileSchema = z.strictObject({
  name: z.string().max(256).optional(),
  allowlist: z.array(z.string()).optional(),
  denylist: z.array(z.string()).optional(),
  wildcardPolicy: z.enum(["none", "subdomains_only"]).optional(),
});

export async function createSearchProfileController(
  req: Request,
  res: Response,
): Promise<void> {
  const parse = createProfileSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: "Invalid request body",
      details: parse.error.issues,
    });
    return;
  }

  const input = parse.data as SearchProfileInput;
  const profile = createSearchProfile(input);

  res.status(201).json({
    success: true,
    profile,
  });
}

export async function updateSearchProfileController(
  req: Request,
  res: Response,
): Promise<void> {
  const profileId = req.params.id;
  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: "Invalid request body",
      details: parse.error.issues,
    });
    return;
  }

  const input = parse.data as SearchProfileUpdateInput;
  const profile = updateSearchProfile(profileId, input);
  if (!profile) {
    res.status(404).json({
      success: false,
      error: "Search profile not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    profile,
  });
}

export async function getSearchProfileController(
  req: Request,
  res: Response,
): Promise<void> {
  const profileId = req.params.id;
  const profile = getSearchProfile(profileId);
  if (!profile) {
    res.status(404).json({
      success: false,
      error: "Search profile not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    profile,
  });
}

