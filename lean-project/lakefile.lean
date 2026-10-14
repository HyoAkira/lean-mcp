import Lake
open Lake DSL

package «lean-mcp-sandbox» where
  -- Scratch project: its only job is to hold a built Mathlib so that
  -- `lake env lean` can elaborate arbitrary snippets against it.
  leanOptions := #[
    ⟨`pp.unicode.fun, true⟩,
    ⟨`autoImplicit, false⟩
  ]

require mathlib from git
  "https://github.com/leanprover-community/mathlib4.git" @ "v4.34.1"

@[default_target]
lean_lib Sandbox