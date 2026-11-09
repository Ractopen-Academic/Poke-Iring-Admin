"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  toggleQuestTemplateAction,
  upsertQuestTemplateAction,
} from "../services/moderation-actions";
import type { QuestTemplateItem } from "../types/moderation.types";

interface QuestPoolManagerProps {
  initialQuests: QuestTemplateItem[];
}

export function QuestPoolManager({ initialQuests }: QuestPoolManagerProps) {
  const [quests, setQuests] = useState<QuestTemplateItem[]>(initialQuests);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<"daily" | "weekly">("daily");
  const [newTarget, setNewTarget] = useState(2000);
  const [newReward, setNewReward] = useState(50);
  const [newWeight, setNewWeight] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleToggle = async (id: string, current: boolean) => {
    const updated = !current;
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isActive: updated } : q))
    );
    await toggleQuestTemplateAction(id, updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    const newQuest: QuestTemplateItem = {
      id: `tpl_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || `Complete ${newTarget} patrol units.`,
      category: newCategory,
      type: "steps",
      targetValue: newTarget,
      rewardPawPoints: newReward,
      weight: newWeight,
      isActive: true,
    };

    const res = await upsertQuestTemplateAction(newQuest);
    setIsSubmitting(false);

    if (res.success) {
      setQuests((prev) => [newQuest, ...prev]);
      setIsCreating(false);
      setNewTitle("");
      setNewDesc("");
      setMessage("Quest template added to live pool.");
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage(res.error || "Failed to create quest template.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">
            Active Quest Templates Pool ({quests.length})
          </h3>
          <p className="text-xs text-neutral-400">
            Daily and weekly patrol assignments randomly weighted and synced to Flutter explorers.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="gap-1.5 bg-[#FF8C1A] text-white hover:bg-[#E06D00] text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {isCreating ? "Close Form" : "New Template"}
        </Button>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
          {message}
        </div>
      )}

      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3 text-xs"
        >
          <div className="font-semibold text-neutral-200">New Quest Template</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="q-title" className="text-xs">Quest Title</Label>
              <Input
                id="q-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Sunset Barangay Circuit"
                required
                className="mt-1 bg-neutral-950 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="q-category" className="text-xs">Cadence Category</Label>
              <select
                id="q-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as "daily" | "weekly")}
                className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200"
              >
                <option value="daily">Daily Patrol</option>
                <option value="weekly">Weekly Expedition</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="q-desc" className="text-xs">Description</Label>
              <Input
                id="q-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short instructions for the mobile app"
                className="mt-1 bg-neutral-950 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="q-target" className="text-xs">Target Steps / Unit</Label>
              <Input
                id="q-target"
                type="number"
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="mt-1 bg-neutral-950 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="q-reward" className="text-xs">Reward Paw Points</Label>
              <Input
                id="q-reward"
                type="number"
                value={newReward}
                onChange={(e) => setNewReward(Number(e.target.value))}
                className="mt-1 bg-neutral-950 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="q-weight" className="text-xs">Spawn Weight (%)</Label>
              <Input
                id="q-weight"
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="mt-1 bg-neutral-950 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#FF8C1A] text-white hover:bg-[#E06D00] text-xs"
            >
              {isSubmitting ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="border-b border-neutral-800 bg-neutral-900 text-neutral-400">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Title &amp; Goal</th>
              <th className="py-2.5 px-3 font-semibold">Category</th>
              <th className="py-2.5 px-3 font-semibold">Target</th>
              <th className="py-2.5 px-3 font-semibold">Paw Points</th>
              <th className="py-2.5 px-3 font-semibold">Weight</th>
              <th className="py-2.5 px-3 text-right font-semibold">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {quests.map((q) => (
              <tr key={q.id} className="hover:bg-neutral-800/30 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-neutral-100">{q.title}</div>
                  <div className="text-[11px] text-neutral-500">{q.description}</div>
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {q.category}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 font-mono">{q.targetValue}</td>
                <td className="py-2.5 px-3 font-mono text-[#FF8C1A]">+{q.rewardPawPoints}</td>
                <td className="py-2.5 px-3 font-mono text-neutral-400">{q.weight}%</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">
                      {q.isActive ? "Active" : "Disabled"}
                    </span>
                    <Switch
                      checked={q.isActive}
                      onCheckedChange={() => handleToggle(q.id, q.isActive)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
