"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyProjectDraft,
  projectCategories,
  validateProjectDraft,
  createProject,
  type ProjectCategory,
  type ProjectDraft,
  type ProjectErrors,
  type ProjectField,
} from "@/features/projects/project";
import { useProjectStore } from "@/features/projects/project-store";

const fieldIds: Record<ProjectField, string> = {
  name: "project-name",
  category: "project-category",
  location: "project-location",
  startDate: "project-start-date",
  endDate: "project-end-date",
  description: "project-impact-story",
};

export function ProjectForm() {
  const router = useRouter();
  const addProject = useProjectStore((state) => state.addProject);
  const [draft, setDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [errors, setErrors] = useState<ProjectErrors>({});

  function updateField<Field extends ProjectField>(
    field: Field,
    value: ProjectDraft[Field],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateProjectDraft(draft);
    setErrors(nextErrors);

    const firstInvalidField = Object.keys(nextErrors)[0] as
      | ProjectField
      | undefined;

    if (firstInvalidField) {
      requestAnimationFrame(() => {
        document.getElementById(fieldIds[firstInvalidField])?.focus();
      });
      return;
    }

    const project = createProject({
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      category: draft.category as ProjectCategory,
      location: draft.location.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      description: draft.description.trim(),
    });

    addProject(project);
    toast.success("Project saved on this device");
    router.push(`/projects/${project.id}`);
  }

  return (
    <section className="min-w-0 rounded-2xl border bg-card p-5 sm:p-7">
      <div className="max-w-2xl">
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Start a project
        </h1>
        <p className="mt-3 max-w-[68ch] text-pretty leading-7 text-muted-foreground">
          Record the project context now. Later media and analysis stay linked to
          this same project record.
        </p>
      </div>

      <form className="mt-8" noValidate onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor={fieldIds.name}>Project name</FieldLabel>
            <Input
              id={fieldIds.name}
              name="name"
              value={draft.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined}
              autoComplete="off"
              placeholder="Mangrove Recovery"
            />
            {errors.name ? (
              <FieldError id={`${fieldIds.name}-error`}>
                {errors.name}
              </FieldError>
            ) : null}
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field data-invalid={Boolean(errors.category)}>
              <FieldLabel
                id={`${fieldIds.category}-label`}
                htmlFor={fieldIds.category}
              >
                Category
              </FieldLabel>
              <Select
                value={draft.category || null}
                onValueChange={(value) => {
                  if (value) {
                    updateField("category", value as ProjectCategory);
                  }
                }}
              >
                <SelectTrigger
                  id={fieldIds.category}
                  className="h-10 w-full"
                  aria-labelledby={`${fieldIds.category}-label`}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={
                    errors.category ? `${fieldIds.category}-error` : undefined
                  }
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent align="start">
                  {projectCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category ? (
                <FieldError id={`${fieldIds.category}-error`}>
                  {errors.category}
                </FieldError>
              ) : null}
            </Field>

            <Field data-invalid={Boolean(errors.location)}>
              <FieldLabel htmlFor={fieldIds.location}>Location</FieldLabel>
              <Input
                id={fieldIds.location}
                name="location"
                value={draft.location}
                onChange={(event) => updateField("location", event.target.value)}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={
                  errors.location ? `${fieldIds.location}-error` : undefined
                }
                autoComplete="address-level2"
                placeholder="Pune, Maharashtra"
              />
              {errors.location ? (
                <FieldError id={`${fieldIds.location}-error`}>
                  {errors.location}
                </FieldError>
              ) : null}
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.startDate)}>
              <FieldLabel htmlFor={fieldIds.startDate}>Start date</FieldLabel>
              <Input
                id={fieldIds.startDate}
                name="startDate"
                type="date"
                value={draft.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={
                  errors.startDate ? `${fieldIds.startDate}-error` : undefined
                }
              />
              {errors.startDate ? (
                <FieldError id={`${fieldIds.startDate}-error`}>
                  {errors.startDate}
                </FieldError>
              ) : null}
            </Field>

            <Field data-invalid={Boolean(errors.endDate)}>
              <FieldLabel htmlFor={fieldIds.endDate}>End date</FieldLabel>
              <Input
                id={fieldIds.endDate}
                name="endDate"
                type="date"
                value={draft.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={
                  errors.endDate ? `${fieldIds.endDate}-error` : undefined
                }
              />
              {errors.endDate ? (
                <FieldError id={`${fieldIds.endDate}-error`}>
                  {errors.endDate}
                </FieldError>
              ) : null}
            </Field>
          </div>

          <Field data-invalid={Boolean(errors.description)}>
            <FieldLabel htmlFor={fieldIds.description}>Impact story</FieldLabel>
            <FieldDescription id={`${fieldIds.description}-description`}>
              Describe the change this project aims to create.
            </FieldDescription>
            <Textarea
              id={fieldIds.description}
              name="description"
              value={draft.description}
              onChange={(event) => updateField("description", event.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description
                  ? `${fieldIds.description}-description ${fieldIds.description}-error`
                  : `${fieldIds.description}-description`
              }
              className="min-h-32 resize-y"
              placeholder="What changed, for whom, and how will success be shown?"
            />
            {errors.description ? (
              <FieldError id={`${fieldIds.description}-error`}>
                {errors.description}
              </FieldError>
            ) : null}
          </Field>

          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              You can reopen this project after refreshing the page.
            </p>
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Save project
            </Button>
          </div>
        </FieldGroup>
      </form>
    </section>
  );
}
