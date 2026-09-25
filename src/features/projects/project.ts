export const projectCategories = [
  { value: "tree-plantation", label: "Tree plantation" },
  { value: "water-conservation", label: "Water conservation" },
  { value: "infrastructure", label: "Infrastructure" },
] as const;

export type ProjectCategory = (typeof projectCategories)[number]["value"];

export type Project = {
  id: string;
  name: string;
  category: ProjectCategory;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ProjectDraft = {
  name: string;
  category: ProjectCategory | "";
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ProjectField = keyof ProjectDraft;
export type ProjectErrors = Partial<Record<ProjectField, string>>;

export const emptyProjectDraft: ProjectDraft = {
  name: "",
  category: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
};

export function getProjectCategoryLabel(category: ProjectCategory) {
  return (
    projectCategories.find((option) => option.value === category)?.label ??
    "Uncategorised"
  );
}

export function validateProjectDraft(draft: ProjectDraft): ProjectErrors {
  const errors: ProjectErrors = {};
  const name = draft.name.trim();
  const location = draft.location.trim();
  const description = draft.description.trim();

  if (!name) {
    errors.name = "Project name is required";
  }

  if (!draft.category) {
    errors.category = "Choose a project category";
  }

  if (!location) {
    errors.location = "Location is required";
  }

  if (!draft.startDate) {
    errors.startDate = "Start date is required";
  }

  if (!draft.endDate) {
    errors.endDate = "End date is required";
  } else if (draft.startDate && draft.endDate < draft.startDate) {
    errors.endDate = "End date must be on or after the start date";
  }

  if (!description) {
    errors.description = "Impact story is required";
  }

  return errors;
}

export function formatProjectDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
