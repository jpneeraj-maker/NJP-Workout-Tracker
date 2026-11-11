import React from "react";
import {
  ArrowLeft,
  Check,
  FolderInput,
  ImagePlus,
  Merge,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  buildExerciseCatalog,
  findSimilarCatalogGroups,
  groupCatalogByMuscle,
  hideExerciseFromRepo,
  MUSCLE_GROUPS,
  renameExerciseEverywhere,
  setRepoImageForName,
  upsertRepoEntry,
} from "../exerciseCatalog";
import {
  deleteExerciseImageByUrl,
  uploadExerciseImage,
} from "../exerciseImageUpload";
import { normalizeExerciseName } from "../exerciseImages";

export default function ExerciseRepoPage({
  data,
  setData,
  setActiveScreen,
}) {
  const [query, setQuery] = React.useState("");
  const [uploadingKey, setUploadingKey] = React.useState(null);
  const [muscleFilter, setMuscleFilter] = React.useState("All");
  const [showSimilarOnly, setShowSimilarOnly] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [draftNames, setDraftNames] = React.useState({});
  const [unifyMode, setUnifyMode] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState(() => new Set());
  const [unifyName, setUnifyName] = React.useState("");
  const [unifyImage, setUnifyImage] = React.useState(null);
  const [movingItem, setMovingItem] = React.useState(null);
  const imageInputRef = React.useRef(null);
  const pendingImageKeyRef = React.useRef(null);
  const addInputRef = React.useRef(null);

  const catalog = React.useMemo(() => buildExerciseCatalog(data), [data]);
  const similarGroups = React.useMemo(
    () => findSimilarCatalogGroups(catalog),
    [catalog]
  );
  const similarKeys = React.useMemo(() => {
    const keys = new Set();
    similarGroups.forEach((group) =>
      group.forEach((item) => keys.add(item.key))
    );
    return keys;
  }, [similarGroups]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (muscleFilter !== "All" && item.muscleGroup !== muscleFilter) {
        return false;
      }
      if (showSimilarOnly && !similarKeys.has(item.key)) return false;
      if (!q) return true;
      const hay = `${item.name} ${(item.aliases || []).join(" ")} ${item.muscleGroup || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, query, showSimilarOnly, similarKeys, muscleFilter]);

  const grouped = React.useMemo(
    () => groupCatalogByMuscle(filtered),
    [filtered]
  );

  const selectedItems = React.useMemo(
    () => catalog.filter((item) => selectedKeys.has(item.key)),
    [catalog, selectedKeys]
  );

  const selectableImages = React.useMemo(() => {
    const seen = new Set();
    const images = [];
    for (const item of selectedItems) {
      if (!item.image || seen.has(item.image)) continue;
      seen.add(item.image);
      images.push({ key: item.key, name: item.name, image: item.image });
    }
    return images;
  }, [selectedItems]);

  React.useEffect(() => {
    setDraftNames((prev) => {
      const next = { ...prev };
      for (const item of catalog) {
        if (next[item.key] === undefined) next[item.key] = item.name;
      }
      for (const key of Object.keys(next)) {
        if (!catalog.some((item) => item.key === key)) delete next[key];
      }
      return next;
    });
  }, [catalog]);

  React.useEffect(() => {
    if (!showAdd) return;
    const id = requestAnimationFrame(() => addInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [showAdd]);

  React.useEffect(() => {
    if (!unifyMode) return;
    setSelectedKeys((prev) => {
      const valid = new Set(catalog.map((item) => item.key));
      const next = new Set([...prev].filter((key) => valid.has(key)));
      return next.size === prev.size ? prev : next;
    });
  }, [catalog, unifyMode]);

  React.useEffect(() => {
    if (!unifyMode) return;
    if (selectedItems.length === 0) {
      setUnifyName("");
      setUnifyImage(null);
      return;
    }
    setUnifyName((prev) => {
      if (prev && selectedItems.some((item) => item.name === prev)) return prev;
      return selectedItems[0].name;
    });
    setUnifyImage((prev) => {
      if (prev && selectableImages.some((entry) => entry.image === prev)) {
        return prev;
      }
      return selectableImages[0]?.image || null;
    });
  }, [unifyMode, selectedItems, selectableImages]);

  const updateData = (updater) => {
    setData((prev) => {
      const current = prev || { routines: {} };
      return typeof updater === "function" ? updater(current) : updater;
    });
  };

  const exitUnifyMode = () => {
    setUnifyMode(false);
    setSelectedKeys(new Set());
    setUnifyName("");
    setUnifyImage(null);
  };

  const enterUnifyMode = () => {
    setShowAdd(false);
    setNewName("");
    setUnifyMode(true);
    setSelectedKeys(new Set());
    setUnifyName("");
    setUnifyImage(null);
  };

  const toggleSelected = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openImagePicker = (key) => {
    pendingImageKeyRef.current = key;
    imageInputRef.current?.click();
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    const key = pendingImageKeyRef.current;
    event.target.value = "";
    pendingImageKeyRef.current = null;
    if (!file || !key) return;

    const item = catalog.find((entry) => entry.key === key);
    if (!item) return;

    setUploadingKey(key);
    try {
      const previousUrl =
        typeof item.image === "string" && item.image.startsWith("http")
          ? item.image
          : null;
      const { url } = await uploadExerciseImage(file, { name: item.name });
      updateData((prev) => setRepoImageForName(prev, item.name, url));
      if (previousUrl && previousUrl !== url) {
        await deleteExerciseImageByUrl(previousUrl);
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Image upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  const commitNameEdit = (item) => {
    const nextName = String(draftNames[item.key] ?? item.name).trim();
    if (!nextName) {
      setDraftNames((prev) => ({ ...prev, [item.key]: item.name }));
      return;
    }
    if (normalizeExerciseName(nextName) === item.key) {
      if (nextName !== item.name) {
        updateData((prev) =>
          upsertRepoEntry(prev, {
            name: nextName,
            aliases: item.aliases || [],
            muscleGroup: item.muscleGroup,
            image:
              typeof item.image === "string" && item.image.startsWith("http")
                ? item.image
                : undefined,
          })
        );
      }
      return;
    }

    updateData((prev) =>
      renameExerciseEverywhere(prev, {
        fromNames: [item.name, ...(item.aliases || [])],
        toName: nextName,
        keepAliases: true,
      })
    );
  };

  const addExerciseToRepo = () => {
    const name = newName.trim();
    if (!name) return;
    updateData((prev) =>
      upsertRepoEntry(prev, {
        name,
        aliases: [],
        muscleGroup: muscleFilter !== "All" ? muscleFilter : undefined,
      })
    );
    setNewName("");
    setShowAdd(false);
    setQuery("");
    setMuscleFilter("All");
  };

  const mergeGroupInto = (group, canonicalName) => {
    if (!canonicalName) return;
    if (
      !confirm(
        `Rename these to "${canonicalName}"?\n\n${group
          .map((g) => g.name)
          .join("\n")}\n\nOther spellings become aliases.`
      )
    ) {
      return;
    }
    const fromNames = [
      ...new Set(
        group.flatMap((item) => [item.name, ...(item.aliases || [])])
      ),
    ];
    updateData((prev) =>
      renameExerciseEverywhere(prev, {
        fromNames,
        toName: canonicalName,
        keepAliases: true,
      })
    );
    setShowSimilarOnly(false);
    setQuery("");
    setMuscleFilter("All");
  };

  const applyUnify = () => {
    const name = unifyName.trim();
    if (selectedItems.length < 2) {
      alert("Select at least 2 exercises to unify.");
      return;
    }
    if (!name) {
      alert("Choose the name to keep.");
      return;
    }
    if (
      !confirm(
        `Unify ${selectedItems.length} exercises as "${name}"?\n\n${selectedItems
          .map((item) => item.name)
          .join("\n")}\n\nOther names become aliases.`
      )
    ) {
      return;
    }

    const fromNames = [
      ...new Set(
        selectedItems.flatMap((item) => [item.name, ...(item.aliases || [])])
      ),
    ];

    updateData((prev) =>
      renameExerciseEverywhere(prev, {
        fromNames,
        toName: name,
        keepAliases: true,
        image: unifyImage || null,
      })
    );

    exitUnifyMode();
    setShowSimilarOnly(false);
    setQuery("");
    setMuscleFilter("All");
  };

  const hideItem = (item) => {
    if (
      !confirm(
        `Hide "${item.name}" from the Exercise Repo?\n\nIt stays in your routines/Settings.`
      )
    ) {
      return;
    }
    updateData((prev) => hideExerciseFromRepo(prev, item.name));
  };

  const moveMuscleGroup = (item, muscleGroup) => {
    if (!item || !muscleGroup || muscleGroup === item.muscleGroup) {
      setMovingItem(null);
      return;
    }
    updateData((prev) =>
      upsertRepoEntry(prev, {
        name: item.name,
        aliases: item.aliases || [],
        muscleGroup,
        image:
          typeof item.image === "string" && item.image.startsWith("http")
            ? item.image
            : undefined,
      })
    );
    setMovingItem(null);
  };

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />

      <div className="mb-3 grid grid-cols-[auto_1fr] items-center gap-2 pt-3">
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, "");
            setActiveScreen("landing");
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-[#c7a86a55] bg-black/35 px-3 py-2.5 text-[#d7c7a4] backdrop-blur-sm transition active:scale-[0.97]"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="min-w-0 text-center sm:text-left">
          <div className="text-lg font-semibold text-white sm:text-xl">
            Exercise Repo
          </div>
          <div className="text-[11px] text-[#d7c7a4]/70">
            {catalog.length} exercises
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
          <Search size={15} className="shrink-0 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>
        <button
          type="button"
          aria-label={unifyMode ? "Cancel unify" : "Unify exercises"}
          title={unifyMode ? "Cancel unify" : "Unify exercises"}
          onClick={() => {
            if (unifyMode) exitUnifyMode();
            else enterUnifyMode();
          }}
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 ${
            unifyMode
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#c7a86a55] bg-[#c7a86a18] text-[#d7c7a4]"
          }`}
        >
          {unifyMode ? <X size={16} /> : <Merge size={16} />}
        </button>
        {!unifyMode ? (
          <button
            type="button"
            aria-label={showAdd ? "Cancel add" : "Add exercise"}
            onClick={() => {
              setShowAdd((open) => !open);
              setNewName("");
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c7a86a55] bg-[#c7a86a18] text-[#d7c7a4] active:scale-95"
          >
            {showAdd ? <X size={16} /> : <Plus size={16} />}
          </button>
        ) : null}
      </div>

      {unifyMode ? (
        <div className="mb-3 space-y-3 rounded-2xl border border-[#c7a86a40] bg-[#c7a86a12] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#d7c7a4]/85">
            Unify · select {selectedItems.length} exercise
            {selectedItems.length === 1 ? "" : "s"}
          </div>
          <div className="text-xs text-white/55">
            Tap exercises below, then choose the name and image to keep.
          </div>

          {selectedItems.length > 0 ? (
            <>
              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
                  Name
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selectedItems.map((item) => {
                    const active = unifyName === item.name;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setUnifyName(item.name)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] transition active:scale-95 ${
                          active
                            ? "border-[#c7a86a]/80 bg-[#c7a86a]/20 text-[#f5e7c8]"
                            : "border-white/10 bg-black/35 text-white/70"
                        }`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
                <input
                  value={unifyName}
                  onChange={(e) => setUnifyName(e.target.value)}
                  placeholder="Or type a custom name"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
                  Image
                </div>
                {selectableImages.length === 0 ? (
                  <div className="text-xs text-white/45">
                    None of the selected exercises have an image.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectableImages.map((entry) => {
                      const active = unifyImage === entry.image;
                      return (
                        <button
                          key={entry.image}
                          type="button"
                          onClick={() => setUnifyImage(entry.image)}
                          title={entry.name}
                          className={`relative h-14 w-24 overflow-hidden rounded-xl border bg-black/70 transition active:scale-95 ${
                            active
                              ? "border-[#c7a86a] ring-1 ring-[#c7a86a]/60"
                              : "border-white/10"
                          }`}
                        >
                          <img
                            src={entry.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                          {active ? (
                            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c7a86a] text-black">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setUnifyImage(null)}
                      className={`flex h-14 w-24 items-center justify-center rounded-xl border text-[11px] transition active:scale-95 ${
                        unifyImage === null
                          ? "border-[#c7a86a] bg-[#c7a86a]/15 text-[#f5e7c8]"
                          : "border-white/10 bg-black/35 text-white/55"
                      }`}
                    >
                      No image
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : null}

          <button
            type="button"
            disabled={selectedItems.length < 2 || !unifyName.trim()}
            onClick={applyUnify}
            className="w-full rounded-xl border border-[#c7a86a55] bg-[#c7a86a22] px-3 py-2.5 text-sm text-[#f5e7c8] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Unify selected
          </button>
        </div>
      ) : null}

      {showAdd && !unifyMode ? (
        <div className="mb-3 flex gap-2">
          <input
            ref={addInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New exercise name"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35"
            onKeyDown={(e) => {
              if (e.key === "Enter") addExerciseToRepo();
              if (e.key === "Escape") {
                setShowAdd(false);
                setNewName("");
              }
            }}
          />
          <button
            type="button"
            onClick={addExerciseToRepo}
            className="rounded-xl border border-[#c7a86a55] bg-[#c7a86a18] px-3 py-2.5 text-sm text-[#d7c7a4] active:scale-[0.98]"
          >
            Save
          </button>
        </div>
      ) : null}

      <div className="mb-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {["All", ...MUSCLE_GROUPS].map((group) => {
          const active = muscleFilter === group;
          const count =
            group === "All"
              ? catalog.length
              : catalog.filter((item) => item.muscleGroup === group).length;
          return (
            <button
              key={group}
              type="button"
              onClick={() => setMuscleFilter(group)}
              className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] transition active:scale-95 ${
                active
                  ? "border-[#c7a86a]/70 bg-[#c7a86a]/15 text-[#f5e7c8]"
                  : "border-white/10 bg-black/30 text-white/55"
              }`}
            >
              {group}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSimilarOnly((v) => !v)}
          className={`rounded-lg border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition active:scale-95 ${
            showSimilarOnly
              ? "border-[#c7a86a]/70 bg-[#c7a86a]/15 text-[#f5e7c8]"
              : "border-white/10 bg-black/30 text-white/55"
          }`}
        >
          Similar names {similarGroups.length ? `(${similarGroups.length})` : ""}
        </button>
      </div>

      {showSimilarOnly && similarGroups.length > 0 && !unifyMode && (
        <div className="mb-3 space-y-2 rounded-2xl border border-[#c7a86a40] bg-[#c7a86a12] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#d7c7a4]/80">
            Unify similar names
          </div>
          {similarGroups.slice(0, 8).map((group) => (
            <div
              key={group.map((g) => g.key).join("|")}
              className="rounded-xl border border-white/10 bg-black/30 p-2.5"
            >
              <div className="mb-2 text-xs text-white/70">
                {group.map((g) => g.name).join(" · ")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => mergeGroupInto(group, g.name)}
                    className="rounded-lg border border-[#c7a86a55] bg-black/40 px-2.5 py-1 text-[11px] text-[#f5e7c8] active:scale-95"
                  >
                    Use “{g.name}”
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {movingItem ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close move picker"
            onClick={() => setMovingItem(null)}
          />
          <div className="relative z-[1] w-full max-w-sm rounded-2xl border border-white/10 bg-[#12110f] p-4 shadow-2xl">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#d7c7a4]/80">
                  Move to
                </div>
                <div className="mt-1 truncate text-sm font-medium text-white">
                  {movingItem.name}
                </div>
                <div className="mt-0.5 text-[11px] text-white/45">
                  Currently in {movingItem.muscleGroup || "Other"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMovingItem(null)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/45 hover:bg-white/5 hover:text-white active:scale-95"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {MUSCLE_GROUPS.map((group) => {
                const active = (movingItem.muscleGroup || "Other") === group;
                return (
                  <button
                    key={group}
                    type="button"
                    disabled={active}
                    onClick={() => moveMuscleGroup(movingItem, group)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition active:scale-[0.98] disabled:cursor-default ${
                      active
                        ? "border-[#c7a86a]/70 bg-[#c7a86a]/18 text-[#f5e7c8]"
                        : "border-white/10 bg-black/40 text-white/80 hover:border-white/20 hover:bg-black/55"
                    }`}
                  >
                    {group}
                    {active ? (
                      <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-[#d7c7a4]/70">
                        Current
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-4 max-h-[62vh] space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/30 p-2">
        {filtered.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-white/45">
            No exercises match.
          </div>
        ) : (
          grouped.map((section) => (
            <div key={section.group}>
              <div className="sticky top-0 z-[1] mb-1.5 flex items-center justify-between rounded-lg bg-black/85 px-2 py-1.5 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-[0.16em] text-[#d7c7a4]/85">
                  {section.group}
                </div>
                <div className="text-[10px] text-white/35">
                  {section.items.length}
                </div>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const selected = selectedKeys.has(item.key);
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                        unifyMode && selected
                          ? "border-[#c7a86a]/70 bg-[#c7a86a]/12"
                          : "border-white/10 bg-black/25"
                      }`}
                    >
                      {unifyMode ? (
                        <button
                          type="button"
                          onClick={() => toggleSelected(item.key)}
                          aria-pressed={selected}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition active:scale-95 ${
                            selected
                              ? "border-[#c7a86a] bg-[#c7a86a] text-black"
                              : "border-white/25 bg-black/40 text-transparent"
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={unifyMode || uploadingKey === item.key}
                        onClick={() => {
                          if (unifyMode) {
                            toggleSelected(item.key);
                            return;
                          }
                          openImagePicker(item.key);
                        }}
                        className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/70 active:scale-95 disabled:opacity-100"
                        title={unifyMode ? "Select exercise" : "Change image"}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/25">
                            <ImagePlus size={16} />
                          </div>
                        )}
                        {uploadingKey === item.key ? (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[10px] text-white">
                            ...
                          </span>
                        ) : null}
                      </button>

                      {unifyMode ? (
                        <button
                          type="button"
                          onClick={() => toggleSelected(item.key)}
                          className="min-w-0 flex-1 text-left text-sm font-medium text-white"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <input
                          value={draftNames[item.key] ?? item.name}
                          onChange={(e) =>
                            setDraftNames((prev) => ({
                              ...prev,
                              [item.key]: e.target.value,
                            }))
                          }
                          onBlur={() => commitNameEdit(item)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none"
                        />
                      )}

                      {!unifyMode ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setMovingItem(item)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-[#d7c7a4] active:scale-95"
                            aria-label={`Move ${item.name} to another muscle group`}
                            title="Move to muscle group"
                          >
                            <FolderInput size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => hideItem(item)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/35 hover:bg-white/5 hover:text-red-300 active:scale-95"
                            aria-label={`Hide ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
