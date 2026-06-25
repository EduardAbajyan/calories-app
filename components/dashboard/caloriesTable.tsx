"use client";

import { JSX, useState, useEffect } from "react";
import {
  fetchChosenDate,
  addDailyLogItem,
  deleteDailyLogItem,
  updateDailyLogItemAmount,
  type DailyLogItem,
} from "@/server_actions/daily-log";

function EditableAmountCell({
  logId,
  amount,
  onSaved,
}: {
  logId: number;
  amount: number;
  onSaved: () => Promise<void>;
}): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState(String(amount));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraftAmount(String(amount));
    }
  }, [amount, isEditing]);

  async function saveAmount() {
    const parsed = Number(draftAmount);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      setDraftAmount(String(amount));
      setIsEditing(false);
      return;
    }

    if (parsed === amount) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const result = await updateDailyLogItemAmount(logId, parsed);
    setIsSaving(false);

    if (!result.success) {
      console.error("Failed to update amount", result.error);
      setDraftAmount(String(amount));
      setIsEditing(false);
      return;
    }

    setIsEditing(false);
    await onSaved();
  }

  if (isEditing) {
    return (
      <input
        type="number"
        min={1}
        step={1}
        value={draftAmount}
        onChange={(event) => setDraftAmount(event.target.value)}
        onBlur={() => {
          if (!isSaving) {
            void saveAmount();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (!isSaving) {
              void saveAmount();
            }
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDraftAmount(String(amount));
            setIsEditing(false);
          }
        }}
        autoFocus
        className="w-20 rounded-xl border border-border bg-surface-elevated px-2 py-1 text-sm text-foreground outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="inline-flex w-full cursor-pointer items-center rounded-lg px-2 py-1 text-left transition hover:bg-accent-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Edit amount"
      title="Click to edit amount"
    >
      {amount}g
    </button>
  );
}

export default function TableComponent({
  day,
  refreshKey,
  onDayLoad,
}: {
  day: number | undefined;
  refreshKey?: string;
  onDayLoad?: () => void;
}): JSX.Element {
  const tzOffsetMin = new Date().getTimezoneOffset();
  const dataCellClass = "px-3 py-3 text-sm text-foreground";
  const metricCellClass =
    "px-3 py-3 text-sm font-medium text-foreground/75 whitespace-nowrap";
  const deleteCellClass =
    "w-12 px-3 py-3 text-center text-foreground/55 transition hover:text-accent";
  const inputClass =
    "w-full min-w-0 rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft";

  function renderItemAvatar(name: string, image?: string | null) {
    const initial = name.trim().charAt(0).toUpperCase() || "?";

    if (image) {
      return (
        <img
          src={image}
          alt={name}
          className="h-8 w-8 shrink-0 rounded-xl border border-border object-cover shadow-sm"
        />
      );
    }

    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated text-[11px] font-semibold uppercase text-accent shadow-sm">
        {initial}
      </div>
    );
  }

  const [set, setSet] = useState<
    | {
        id: number;
        checkbox: JSX.Element;
        name: JSX.Element;
        amount: JSX.Element;
        calories: JSX.Element;
        protein: JSX.Element;
        carbohydrates: JSX.Element;
        fat: JSX.Element;
      }[]
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState(1);
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [saveButton, setSaveButton] = useState(false);
  const [newItems, setNewItems] = useState<{
    [key: number]: {
      name: string;
      amount: string;
      calories: string;
      protein: string;
      carbohydrates: string;
      fat: string;
    };
  }>({});

  async function refreshExistingRows() {
    const dailyLogData = await fetchChosenDate(day, tzOffsetMin);

    const formattedData = dailyLogData.map((item: DailyLogItem) => ({
      id: item.id,
      checkbox: (
        <td
          className={`${deleteCellClass} cursor-pointer`}
          onClick={() => deleteHandler(item.id)}
        >
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-elevated shadow-sm">
            ✓
          </div>
        </td>
      ),
      name: (
        <td className={`w-1/3 min-w-56 font-medium ${dataCellClass}`}>
          <div className="flex items-center gap-3">
            {renderItemAvatar(item.name, item.image)}
            <span className="min-w-0 truncate">{item.name}</span>
          </div>
        </td>
      ),
      amount: (
        <td className={`w-28 ${metricCellClass} cursor-pointer`}>
          <EditableAmountCell
            logId={item.id}
            amount={item.amount}
            onSaved={refreshExistingRows}
          />
        </td>
      ),
      calories: (
        <td className={`w-32 ${metricCellClass}`}>{item.calories} cal</td>
      ),
      protein: <td className={`w-24 ${metricCellClass}`}>{item.protein}g</td>,
      carbohydrates: (
        <td className={`w-32 ${metricCellClass}`}>{item.carbohydrates}g</td>
      ),
      fat: <td className={`w-20 ${metricCellClass}`}>{item.fat}g</td>,
    }));

    setSet(formattedData);
    if (dailyLogData.length > 0) {
      setId(Math.max(...dailyLogData.map((item) => item.id)));
    }
  }

  // Fetch today's data from database
  useEffect(() => {
    async function fetchTodaysData() {
      try {
        setLoading(true);
        await refreshExistingRows();
      } catch (error) {
        console.error("Error fetching daily log:", error);
        setSet([]);
      } finally {
        setLoading(false);
        onDayLoad?.();
      }
    }
    fetchTodaysData();
  }, [day, onDayLoad, refreshKey]);

  useEffect(() => {
    if (newItemsCount === 0) setSaveButton(false);
  }, [newItemsCount]);

  async function deleteHandler(id: number) {
    if (id < 0) {
      // Handle temporary new items (negative IDs)
      setSet((prev) => {
        const newSet = prev?.filter((item) => item?.id !== id) || null;
        return newSet;
      });
      setNewItemsCount((prev) => prev - 1);
      const newItemsCopy = { ...newItems };
      delete newItemsCopy[id];
      setNewItems(newItemsCopy);
    } else {
      // Handle existing database items
      const result = await deleteDailyLogItem(id);
      if (result.success) {
        setSet((prev) => {
          const newSet = prev?.filter((item) => item?.id !== id) || null;
          return newSet;
        });
      }
    }
  }

  function addHandler() {
    const newId = -Date.now(); // Use negative timestamp for temp IDs
    const initialItemData = {
      name: "",
      amount: "",
      calories: "",
      protein: "",
      carbohydrates: "",
      fat: "",
    };

    setNewItemsCount((prev) => prev + 1);
    setNewItems((prev) => ({ ...prev, [newId]: initialItemData }));

    setSet((prev) => {
      const newSet = [
        ...(prev || []),
        {
          id: newId,
          checkbox: (
            <td
              className={`${deleteCellClass} cursor-pointer`}
              onClick={() => deleteHandler(newId)}
            >
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-elevated shadow-sm">
                ×
              </div>
            </td>
          ),
          name: (
            <td className="w-1/3 min-w-56 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated text-[11px] font-semibold uppercase text-accent shadow-sm">
                  +
                </div>
                <input
                  type="text"
                  placeholder="Name"
                  defaultValue=""
                  onChange={(e) =>
                    setNewItems((prev) => ({
                      ...prev,
                      [newId]: {
                        ...(prev[newId] || {
                          name: "",
                          amount: "",
                          calories: "",
                          protein: "",
                          carbohydrates: "",
                          fat: "",
                        }),
                        name: e.target.value,
                      },
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </td>
          ),
          amount: (
            <td className="w-28 px-3 py-3">
              <input
                type="number"
                placeholder="Grams"
                defaultValue=""
                onChange={(e) =>
                  setNewItems((prev) => ({
                    ...prev,
                    [newId]: {
                      ...(prev[newId] || {
                        name: "",
                        amount: "",
                        calories: "",
                        protein: "",
                        carbohydrates: "",
                        fat: "",
                      }),
                      amount: e.target.value,
                    },
                  }))
                }
                className={inputClass}
              />
            </td>
          ),
          calories: (
            <td className="w-32 px-3 py-3">
              <input
                type="number"
                placeholder="Total calories"
                defaultValue=""
                onChange={(e) =>
                  setNewItems((prev) => ({
                    ...prev,
                    [newId]: {
                      ...(prev[newId] || {
                        name: "",
                        amount: "",
                        calories: "",
                        protein: "",
                        carbohydrates: "",
                        fat: "",
                      }),
                      calories: e.target.value,
                    },
                  }))
                }
                className={inputClass}
              />
            </td>
          ),
          protein: (
            <td className="w-24 px-3 py-3">
              <input
                type="number"
                placeholder="Protein"
                defaultValue=""
                onChange={(e) =>
                  setNewItems((prev) => ({
                    ...prev,
                    [newId]: {
                      ...(prev[newId] || {
                        name: "",
                        amount: "",
                        calories: "",
                        protein: "",
                        carbohydrates: "",
                        fat: "",
                      }),
                      protein: e.target.value,
                    },
                  }))
                }
                className={inputClass}
              />
            </td>
          ),
          carbohydrates: (
            <td className="w-32 px-3 py-3">
              <input
                type="number"
                placeholder="Carbs"
                defaultValue=""
                onChange={(e) =>
                  setNewItems((prev) => ({
                    ...prev,
                    [newId]: {
                      ...(prev[newId] || {
                        name: "",
                        amount: "",
                        calories: "",
                        protein: "",
                        carbohydrates: "",
                        fat: "",
                      }),
                      carbohydrates: e.target.value,
                    },
                  }))
                }
                className={inputClass}
              />
            </td>
          ),
          fat: (
            <td className="w-20 px-3 py-3">
              <input
                type="number"
                placeholder="Fat"
                defaultValue=""
                onChange={(e) =>
                  setNewItems((prev) => ({
                    ...prev,
                    [newId]: {
                      ...(prev[newId] || {
                        name: "",
                        amount: "",
                        calories: "",
                        protein: "",
                        carbohydrates: "",
                        fat: "",
                      }),
                      fat: e.target.value,
                    },
                  }))
                }
                className={inputClass}
              />
            </td>
          ),
        },
      ];
      return newSet;
    });
    setSaveButton(true);
  }

  async function saveHandler() {
    setLoading(true);
    let allSuccess = true;

    try {
      // Save all new items
      for (const [, itemData] of Object.entries(newItems)) {
        const { name, amount, calories, protein, carbohydrates, fat } =
          itemData;

        if (name && amount && calories) {
          const result = await addDailyLogItem(
            {
              name: name.trim(),
              amount: parseInt(amount),
              calories: parseInt(calories),
              protein: parseInt(protein || "0"),
              carbohydrates: parseInt(carbohydrates || "0"),
              fat: parseInt(fat || "0"),
            },
            day,
            tzOffsetMin,
          );

          if (!result.success) {
            allSuccess = false;
            console.error("Failed to save item:", name);
          }
        }
      }

      if (allSuccess) {
        // Refresh the data
        await refreshExistingRows();
        setNewItems({});
        setNewItemsCount(0);
        setSaveButton(false);
      }
    } catch (error) {
      console.error("Error saving items:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && set === null) {
    return (
      <div className="min-w-full rounded-[28px] border border-border/70 bg-surface/80 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div className="text-sm font-medium text-foreground/70">
          Loading your daily log... ⏳
        </div>
      </div>
    );
  }

  return (
    <section className="min-w-full max-w-full overflow-auto rounded-[28px] border border-border/70 bg-surface/80 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="min-w-full max-w-full  flex flex-col gap-4 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Entries
          </p>
          <h4 className="text-lg font-semibold tracking-tight text-foreground">
            Daily nutrition table
          </h4>
          <p className="mt-1 text-sm leading-6 text-foreground/70">
            Add, review, and remove foods for the selected day.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addHandler}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface-elevated px-5 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface"
          >
            Add row
          </button>
          {saveButton ? (
            <button
              onClick={saveHandler}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-bold uppercase tracking-[0.14em] text-accent-foreground shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? "Saving..." : "Save entries"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-w-full max-w-full   overflow-x-auto px-3 py-3 sm:px-4 sm:py-4">
        <table className="min-w-full max-w-full   table-fixed overflow-hidden rounded-3xl border border-border/70 bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-elevated)_100%)]">
          <thead>
            <tr className="border-b border-border/70 bg-surface-elevated/80">
              <th className="w-12 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Remove
              </th>
              <th className="w-1/3 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Name
              </th>
              <th className="w-28 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Amount
              </th>
              <th className="w-24 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Protein
              </th>
              <th className="w-32 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Carbs
              </th>
              <th className="w-20 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Fat
              </th>
              <th className="w-32 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Calories
              </th>
            </tr>
          </thead>
          <tbody>
            {set?.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border/70 transition hover:bg-accent-soft/40"
              >
                {item.checkbox}
                {item.name}
                {item.amount}
                {item.protein}
                {item.carbohydrates}
                {item.fat}
                {item.calories}
              </tr>
            ))}
            <tr className="hidden lg:table-row bg-surface/60">
              <td className="px-3 py-4 text-sm font-medium text-foreground/55">
                New
              </td>
              <td className="px-3 py-4 text-sm text-foreground/45">
                Use the button above to add another line item.
              </td>
              <td className="px-3 py-4"></td>
              <td className="px-3 py-4"></td>
              <td className="px-3 py-4"></td>
              <td className="px-3 py-4"></td>
              <td className="px-3 py-4 text-right text-sm text-foreground/55">
                {saveButton ? "Unsaved changes" : "All changes saved"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
