"use client";

import { JSX, useState, useEffect } from "react";
import {
  fetchChosenDate,
  addDailyLogItem,
  deleteDailyLogItem,
  type DailyLogItem,
} from "@/server_actions/daily-log";

export default function TableComponent({
  day,
  onDayLoad,
}: {
  day: number | undefined;
  onDayLoad?: () => void;
}): JSX.Element {
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

  // Fetch today's data from database
  useEffect(() => {
    async function fetchTodaysData() {
      try {
        setLoading(true);
        const dailyLogData = await fetchChosenDate(day);

        const formattedData = dailyLogData.map((item: DailyLogItem) => ({
          id: item.id,
          checkbox: (
            <td
              className="w-12 px-2 py-1.5 cursor-pointer hover:text-fg-brand"
              onClick={() => deleteHandler(item.id)}
            >
              <div className="w-6 h-6 flex items-center justify-center">☐</div>
            </td>
          ),
          name: <td className="w-1/3 px-2 py-1.5 text-body">{item.name}</td>,
          amount: (
            <td className="w-28 px-2 py-1.5 text-body">{item.amount}g</td>
          ),
          calories: (
            <td className="w-32 px-2 py-1.5 text-body">{item.calories} cal</td>
          ),
          protein: (
            <td className="w-24 px-2 py-1.5 text-body">{item.protein}g</td>
          ),
          carbohydrates: (
            <td className="w-32 px-2 py-1.5 text-body">
              {item.carbohydrates}g
            </td>
          ),
          fat: <td className="w-20 px-2 py-1.5 text-body">{item.fat}g</td>,
        }));

        setSet(formattedData);
        if (dailyLogData.length > 0) {
          setId(Math.max(...dailyLogData.map((item) => item.id)));
        }
      } catch (error) {
        console.error("Error fetching daily log:", error);
        setSet([]);
      } finally {
        setLoading(false);
        onDayLoad?.();
      }
    }
    fetchTodaysData();
  }, [day, onDayLoad]);

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
              className="w-12 px-2 py-1.5 cursor-pointer hover:text-fg-brand text-left"
              onClick={() => deleteHandler(newId)}
            >
              <div className="w-6 h-6 flex items-center justify-center">𐄂</div>
            </td>
          ),
          name: (
            <td className="w-1/3 px-2 py-1.5">
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
                className="border border-default rounded-base p-1 w-full min-w-0 bg-neutral-primary-soft text-body focus:ring-2 focus:ring-fg-brand focus:border-fg-brand text-left"
              />
            </td>
          ),
          amount: (
            <td className="w-28 px-2 py-1.5">
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
                className="border border-default rounded-base p-1 w-full min-w-0 bg-neutral-primary-soft text-body focus:ring-2 focus:ring-fg-brand focus:border-fg-brand text-left"
              />
            </td>
          ),
          calories: (
            <td className="w-32 px-2 py-1.5">
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
                className="border border-default rounded-base p-1 w-full min-w-0 bg-neutral-primary-soft text-body focus:ring-2 focus:ring-fg-brand focus:border-fg-brand text-left"
              />
            </td>
          ),
          protein: (
            <td className="w-24 px-2 py-1.5">
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
                className="border border-default rounded-base p-1 w-full min-w-0 bg-neutral-primary-soft text-body focus:ring-2 focus:ring-fg-brand focus:border-fg-brand text-left"
              />
            </td>
          ),
          carbohydrates: (
            <td className="w-32 px-2 py-1.5">
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
                className="border border-default rounded-base p-1 w-full min-w-0 bg-neutral-primary-soft text-body focus:ring-2 focus:ring-fg-brand focus:border-fg-brand text-left"
              />
            </td>
          ),
          fat: (
            <td className="w-20 px-2 py-1.5">
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
                className="border border-default rounded-base p-1 w-full min-w-0 bg-neutral-primary-soft text-body focus:ring-2 focus:ring-fg-brand focus:border-fg-brand text-left"
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
          );

          if (!result.success) {
            allSuccess = false;
            console.error("Failed to save item:", name);
          }
        }
      }

      if (allSuccess) {
        // Refresh the data
        const dailyLogData = await fetchChosenDate(Number(day));
        const formattedData = dailyLogData.map((item: DailyLogItem) => ({
          id: item.id,
          checkbox: (
            <td
              className="w-12 px-2 py-1.5 cursor-pointer hover:text-fg-brand"
              onClick={() => deleteHandler(item.id)}
            >
              <div className="w-6 h-6 flex items-center justify-center">☐</div>
            </td>
          ),
          name: <td className="w-1/3 px-2 py-1.5 text-body">{item.name}</td>,
          amount: (
            <td className="w-28 px-2 py-1.5 text-body">{item.amount}g</td>
          ),
          calories: (
            <td className="w-32 px-2 py-1.5 text-body">{item.calories} cal</td>
          ),
          protein: (
            <td className="w-24 px-2 py-1.5 text-body">{item.protein}g</td>
          ),
          carbohydrates: (
            <td className="w-32 px-2 py-1.5 text-body">
              {item.carbohydrates}g
            </td>
          ),
          fat: <td className="w-20 px-2 py-1.5 text-body">{item.fat}g</td>,
        }));

        setSet(formattedData);
        setNewItems({});
        setNewItemsCount(0);
        setSaveButton(false);

        if (dailyLogData.length > 0) {
          setId(Math.max(...dailyLogData.map((item) => item.id)));
        }
      }
    } catch (error) {
      console.error("Error saving items:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && set === null) {
    return (
      <div className="min-w-full bg-neutral-primary-soft border border-default rounded-base shadow-md mt-10 p-8 text-center">
        <div className="text-body">Loading your daily log... ⏳</div>
      </div>
    );
  }

  return (
    <table className="min-w-full bg-neutral-primary-soft border border-default rounded-base shadow-md mt-10 table-fixed">
      <thead>
        <tr className="border-b border-default">
          <th className="w-12 px-2 py-1.5 text-body font-bold text-left">☑</th>
          <th className="w-1/3 px-2 py-1.5 text-body font-bold text-left">
            Name
          </th>
          <th className="w-28 px-2 py-1.5 text-body font-bold text-left">
            Amount
          </th>
          <th className="w-24 px-2 py-1.5 text-body font-bold text-left">
            Protein
          </th>
          <th className="w-32 px-2 py-1.5 text-body font-bold text-left">
            Carbohydrates
          </th>
          <th className="w-20 px-2 py-1.5 text-body font-bold text-left">
            Fat
          </th>
          <th className="w-32 px-2 py-1.5 text-body font-bold text-left">
            Calories
          </th>
        </tr>
      </thead>
      <tbody>
        {set?.map((item) => (
          <tr
            key={item.id}
            className="border-b border-default hover:bg-neutral-tertiary"
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
        <tr className="border-b border-default hover:bg-neutral-tertiary">
          <td className="w-12 px-2 py-1.5">
            <button
              onClick={addHandler}
              className="hover:text-fg-brand transition duration-75 w-6 h-6 flex items-center justify-center"
            >
              ➕
            </button>
          </td>
          <td className="w-1/3 px-2 py-1.5"></td>
          <td className="w-28 px-2 py-1.5"></td>
          <td className="w-24 px-2 py-1.5"></td>
          <td className="w-32 px-2 py-1.5"></td>
          <td className="w-20 px-2 py-1.5"></td>
          <td className="w-32 px-2 py-1.5">
            {saveButton && (
              <button
                onClick={saveHandler}
                disabled={loading}
                className="hover:text-fg-brand transition duration-75 disabled:opacity-50"
              >
                {loading ? "⏳" : "💾"} Save
              </button>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
