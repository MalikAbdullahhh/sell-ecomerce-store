import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SingleUploader } from "@/components/admin/uploader";
import { adminBtnGhost, adminField, adminTextarea } from "@/components/admin/field";
import {
  sectionDefaults,
  type CmsField,
  type CmsList,
  type CmsSection,
  type SectionValues,
} from "@/lib/page-schema";

type ItemValues = Record<string, unknown>;

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CmsField;
  value: unknown;
  onChange: (value: string | number | boolean) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 py-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={value !== false}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <label className="block space-y-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {field.label}
      </span>

      {field.type === "textarea" && (
        <textarea
          rows={4}
          className={adminTextarea}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "text" && (
        <input
          className={adminField}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          step="any"
          className={adminField}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
      )}

      {field.type === "select" && (
        <select
          className={adminField}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      {field.type === "image" && (
        <SingleUploader value={String(value ?? "")} onChange={(url) => onChange(url)} />
      )}

      {field.help && (
        <span className="block font-mono text-[10px] text-muted-foreground">{field.help}</span>
      )}
    </label>
  );
}

function ListEditor({
  list,
  items,
  onChange,
}: {
  list: CmsList;
  items: ItemValues[];
  onChange: (items: ItemValues[]) => void;
}) {
  const blankItem = () =>
    Object.fromEntries(list.fields.map((f) => [f.key, f.default])) as ItemValues;

  const update = (index: number, key: string, value: unknown) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {list.label} ({items.length})
        </p>
        <button
          type="button"
          className={adminBtnGhost}
          disabled={list.max ? items.length >= list.max : false}
          onClick={() => onChange([...items, blankItem()])}
        >
          <Plus width={12} height={12} className="mr-1" />
          Add {list.itemLabel.toLowerCase()}
        </button>
      </div>

      {items.length === 0 && (
        <p className="border border-dashed border-border p-4 text-center font-mono text-[11px] text-muted-foreground">
          Nothing here yet.
        </p>
      )}

      {items.map((item, index) => (
        <div key={index} className="space-y-3 border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {list.itemLabel} {index + 1}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Move up"
                className="grid h-8 w-8 place-items-center border border-border hover:bg-mist"
                onClick={() => move(index, -1)}
              >
                <ArrowUp width={13} height={13} />
              </button>
              <button
                type="button"
                aria-label="Move down"
                className="grid h-8 w-8 place-items-center border border-border hover:bg-mist"
                onClick={() => move(index, 1)}
              >
                <ArrowDown width={13} height={13} />
              </button>
              <button
                type="button"
                aria-label="Remove"
                className="grid h-8 w-8 place-items-center border border-border text-red-600 hover:bg-red-600/10 dark:text-red-400"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 width={13} height={13} />
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.fields.map((field) => (
              <div
                key={field.key}
                className={field.type === "textarea" || field.type === "image" ? "sm:col-span-2" : ""}
              >
                <FieldInput
                  field={field}
                  value={item[field.key]}
                  onChange={(value) => update(index, field.key, value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionEditor({
  page,
  section,
  values,
  onChange,
}: {
  page: string;
  section: CmsSection;
  values: SectionValues;
  onChange: (values: SectionValues) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...values, [key]: value });
  const hidden = values.visible === false;

  return (
    <section className="border border-border">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-mist/40 px-4 py-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
            {section.label}
            {hidden && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                hidden
              </span>
            )}
          </h3>
          {section.description && (
            <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
          )}
        </div>
        <button
          type="button"
          className={adminBtnGhost}
          onClick={() => {
            if (confirm(`Reset "${section.label}" to the original content?`)) {
              onChange(sectionDefaults(page, section.key));
            }
          }}
        >
          <RotateCcw width={12} height={12} className="mr-1" />
          Reset
        </button>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {(section.fields || []).map((field) => (
            <div
              key={field.key}
              className={
                field.type === "textarea" || field.type === "image" || field.type === "boolean"
                  ? "sm:col-span-2"
                  : ""
              }
            >
              <FieldInput
                field={field}
                value={values[field.key]}
                onChange={(value) => set(field.key, value)}
              />
            </div>
          ))}
        </div>

        {(section.lists || []).map((list) => (
          <ListEditor
            key={list.key}
            list={list}
            items={(values[list.key] as ItemValues[]) || []}
            onChange={(items) => set(list.key, items)}
          />
        ))}
      </div>
    </section>
  );
}
