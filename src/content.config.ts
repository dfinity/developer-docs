import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        doc_type: z
          .enum(["tutorial", "how-to", "reference", "explanation"])
          .optional(),
        level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        features: z.array(z.string()).optional(),
        icskills: z.array(z.string()).optional(),
        last_verified: z.coerce.date().optional(),
        source_repo: z.string().nullable().optional(),
        source_ref: z.string().nullable().optional(),
      }),
    }),
  }),
};
