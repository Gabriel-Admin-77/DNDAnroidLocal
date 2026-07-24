'use client';
import { useState } from 'react';
import { X, Sparkles, Plus, CheckCircle2, Circle, Trash2, Edit3, Award, Scroll, Loader2, ListTodo, ShieldAlert } from 'lucide-react';
import { Quest, QuestSubtask, Character, StoryLogEntry } from '@/lib/types';
import { callDeepSeekDirectly } from '@/lib/ai-client';


interface QuestEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    quests: Quest[];
    onSaveQuests: (quests: Quest[]) => void;
    character: Character;
    logs: StoryLogEntry[];
    adventureTitle: string;
    location: string;
}

export default function QuestEditorModal({
    isOpen,
    onClose,
    quests,
    onSaveQuests,
    character,
    logs,
    adventureTitle,
    location
}: QuestEditorModalProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('active');
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Form state for new/edited quest
    const [editingQuest, setEditingQuest] = useState<Partial<Quest> | null>(null);
    const [newSubtaskText, setNewSubtaskText] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const filteredQuests = quests.filter(q => {
        if (activeTab === 'active') return q.status === 'active';
        if (activeTab === 'completed') return q.status === 'completed';
        return true;
    });

    // DeepSeek AI Quest Generator
    const handleGenerateDeepSeek = async () => {
        setIsGenerating(true);
        setErrorMsg(null);
        try {
            let aiQuests: Quest[] = [];
            const payload = {
                character,
                logs,
                adventureTitle,
                location,
                existingQuests: quests
            };

            try {
                const res = await fetch('/api/deepseek-quest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const text = await res.text();
                if (res.ok && !text.trim().startsWith('<')) {
                    const data = JSON.parse(text);
                    aiQuests = data.quests || [];
                }
            } catch (err) {
                console.warn('Server API route call failed or served static HTML. Falling back to direct client DeepSeek call:', err);
            }

            if (!aiQuests || aiQuests.length === 0) {
                aiQuests = await callDeepSeekDirectly(payload);
            }

            if (!aiQuests || aiQuests.length === 0) {
                setErrorMsg('DeepSeek analysis returned no new quests for the current history.');
                return;
            }


            // Merge AI generated quests with existing quests (avoid duplicate IDs)
            const updated = [...quests];
            aiQuests.forEach(aiQ => {
                const idx = updated.findIndex(q => q.id === aiQ.id || q.title.toLowerCase() === aiQ.title.toLowerCase());
                if (idx >= 0) {
                    updated[idx] = { ...updated[idx], ...aiQ };
                } else {
                    updated.push({
                        ...aiQ,
                        id: aiQ.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        created_at: new Date().toISOString()
                    });
                }
            });

            onSaveQuests(updated);
        } catch (err: any) {
            console.error('DeepSeek Quest Generation Error:', err);
            setErrorMsg(err.message || 'Error communicating with DeepSeek API.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Subtask toggle
    const toggleSubtask = (questId: string, subtaskId: string) => {
        const updated = quests.map(q => {
            if (q.id !== questId) return q;
            const updatedSubtasks = q.subtasks.map(st =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            // Check if all subtasks are completed
            const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
            return {
                ...q,
                subtasks: updatedSubtasks,
                status: allDone ? ('completed' as const) : q.status
            };
        });
        onSaveQuests(updated);
    };

    // Add subtask manually
    const handleAddSubtask = (questId: string) => {
        const text = newSubtaskText[questId]?.trim();
        if (!text) return;

        const updated = quests.map(q => {
            if (q.id !== questId) return q;
            const newSt: QuestSubtask = {
                id: `st_${Date.now()}`,
                text,
                completed: false
            };
            return {
                ...q,
                subtasks: [...(q.subtasks || []), newSt]
            };
        });
        onSaveQuests(updated);
        setNewSubtaskText(prev => ({ ...prev, [questId]: '' }));
    };

    // Delete subtask
    const handleDeleteSubtask = (questId: string, subtaskId: string) => {
        const updated = quests.map(q => {
            if (q.id !== questId) return q;
            return {
                ...q,
                subtasks: q.subtasks.filter(st => st.id !== subtaskId)
            };
        });
        onSaveQuests(updated);
    };

    // Toggle Quest Status
    const toggleQuestStatus = (questId: string) => {
        const updated = quests.map(q => {
            if (q.id !== questId) return q;
            const nextStatus: 'active' | 'completed' = q.status === 'completed' ? 'active' : 'completed';
            return { ...q, status: nextStatus };
        });
        onSaveQuests(updated);
    };

    // Delete Quest
    const handleDeleteQuest = (questId: string) => {
        if (!confirm('Are you sure you want to delete this quest?')) return;
        onSaveQuests(quests.filter(q => q.id !== questId));
    };

    // Save Manual Quest (Create/Edit)
    const handleSaveManualQuest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuest?.title?.trim()) return;

        if (editingQuest.id) {
            // Edit
            const updated = quests.map(q => q.id === editingQuest.id ? { ...q, ...editingQuest } as Quest : q);
            onSaveQuests(updated);
        } else {
            // Create
            const newQ: Quest = {
                id: `q_man_${Date.now()}`,
                title: editingQuest.title.trim(),
                description: editingQuest.description?.trim() || '',
                category: editingQuest.category || 'side',
                status: editingQuest.status || 'active',
                subtasks: editingQuest.subtasks || [],
                rewards: editingQuest.rewards?.trim() || '',
                created_at: new Date().toISOString()
            };
            onSaveQuests([...quests, newQ]);
        }
        setEditingQuest(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400">
                            <Scroll className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-gold-400 flex items-center gap-2">
                                Quest Journal & Task Editor
                            </h2>
                            <p className="text-xs text-stone-400">Powered by DeepSeek AI Choice Analysis</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-stone-800 bg-stone-900/50 flex flex-wrap items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeTab === 'active'
                                    ? 'bg-stone-800 text-gold-400 shadow border border-gold-500/30'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            Active ({quests.filter(q => q.status === 'active').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeTab === 'completed'
                                    ? 'bg-stone-800 text-emerald-400 shadow border border-emerald-500/30'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            Completed ({quests.filter(q => q.status === 'completed').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeTab === 'all'
                                    ? 'bg-stone-800 text-stone-200 shadow border border-stone-700'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                        >
                            All ({quests.length})
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleGenerateDeepSeek}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-500/40 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-md hover:shadow-purple-900/30 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                    <span>DeepSeek Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span>Generate with DeepSeek</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setEditingQuest({ category: 'side', status: 'active', subtasks: [] })}
                            className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4 text-gold-400" />
                            <span>Custom Quest</span>
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {filteredQuests.length === 0 ? (
                        <div className="py-16 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
                            <ListTodo className="w-12 h-12 text-stone-700" />
                            <p className="text-sm">No quests found in this category.</p>
                            <button
                                onClick={handleGenerateDeepSeek}
                                disabled={isGenerating}
                                className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-4"
                            >
                                Let DeepSeek analyze your choices to create quests
                            </button>
                        </div>
                    ) : (
                        filteredQuests.map(quest => (
                            <div
                                key={quest.id}
                                className={`rounded-2xl border p-5 transition-all ${
                                    quest.status === 'completed'
                                        ? 'bg-stone-950/40 border-stone-800/80 opacity-75'
                                        : 'bg-stone-950/80 border-stone-800 hover:border-gold-500/40 shadow-lg'
                                }`}
                            >
                                {/* Quest Header */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    quest.category === 'main'
                                                        ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                                                        : quest.category === 'personal'
                                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                                                }`}
                                            >
                                                {quest.category}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                    quest.status === 'completed'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                        : quest.status === 'failed'
                                                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                                }`}
                                            >
                                                {quest.status}
                                            </span>
                                        </div>
                                        <h3
                                            className={`text-lg font-serif ${
                                                quest.status === 'completed'
                                                    ? 'text-stone-400 line-through'
                                                    : 'text-stone-100 font-semibold'
                                            }`}
                                        >
                                            {quest.title}
                                        </h3>
                                    </div>

                                    {/* Action icons */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => toggleQuestStatus(quest.id)}
                                            title={quest.status === 'completed' ? 'Reopen Quest' : 'Mark Completed'}
                                            className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-400 hover:bg-stone-800 transition-colors"
                                        >
                                            <CheckCircle2 className={`w-4 h-4 ${quest.status === 'completed' ? 'text-emerald-400' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => setEditingQuest(quest)}
                                            title="Edit Quest"
                                            className="p-1.5 rounded-lg text-stone-400 hover:text-gold-400 hover:bg-stone-800 transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuest(quest.id)}
                                            title="Delete Quest"
                                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Quest Description */}
                                {quest.description && (
                                    <p className="text-stone-300 text-xs leading-relaxed mb-4 italic">
                                        "{quest.description}"
                                    </p>
                                )}

                                {/* Subtasks / Objectives Checklist */}
                                <div className="space-y-2 mb-4 bg-stone-900/60 p-3 rounded-xl border border-stone-800/60">
                                    <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                                        Objectives & Tasks ({quest.subtasks?.filter(s => s.completed).length || 0}/
                                        {quest.subtasks?.length || 0})
                                    </div>
                                    {quest.subtasks && quest.subtasks.length > 0 ? (
                                        quest.subtasks.map(subtask => (
                                            <div
                                                key={subtask.id}
                                                className="flex items-center justify-between gap-2 group/st py-1"
                                            >
                                                <button
                                                    onClick={() => toggleSubtask(quest.id, subtask.id)}
                                                    className="flex items-center gap-2.5 text-left text-xs flex-1 text-stone-300 hover:text-stone-100 transition-colors"
                                                >
                                                    {subtask.completed ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-stone-500 shrink-0" />
                                                    )}
                                                    <span className={subtask.completed ? 'line-through text-stone-500' : ''}>
                                                        {subtask.text}
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSubtask(quest.id, subtask.id)}
                                                    className="opacity-0 group-hover/st:opacity-100 text-stone-500 hover:text-red-400 transition-opacity p-1"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-stone-500 text-xs italic">No specific subtasks added yet.</p>
                                    )}

                                    {/* Add Subtask Inline Form */}
                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-800/60">
                                        <input
                                            type="text"
                                            placeholder="Add subtask/objective..."
                                            value={newSubtaskText[quest.id] || ''}
                                            onChange={e => setNewSubtaskText({ ...newSubtaskText, [quest.id]: e.target.value })}
                                            onKeyDown={e => e.key === 'Enter' && handleAddSubtask(quest.id)}
                                            className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-gold-500/50 flex-1"
                                        />
                                        <button
                                            onClick={() => handleAddSubtask(quest.id)}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-3 py-1.5 rounded-lg border border-stone-700 font-medium transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Quest Rewards Footer */}
                                {quest.rewards && (
                                    <div className="flex items-center gap-1.5 text-xs text-gold-400 font-medium pt-1">
                                        <Award className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                                        <span>Reward: {quest.rewards}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Manual Quest Create / Edit Modal */}
            {editingQuest && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <form
                        onSubmit={handleSaveManualQuest}
                        className="bg-stone-900 border border-stone-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
                    >
                        <h3 className="text-lg font-serif text-gold-400 font-bold">
                            {editingQuest.id ? 'Edit Quest' : 'Create Custom Quest'}
                        </h3>

                        <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1">Quest Title *</label>
                            <input
                                type="text"
                                required
                                value={editingQuest.title || ''}
                                onChange={e => setEditingQuest({ ...editingQuest, title: e.target.value })}
                                placeholder="e.g. Slay the Oakhaven Goblins"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-gold-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1">Description</label>
                            <textarea
                                rows={3}
                                value={editingQuest.description || ''}
                                onChange={e => setEditingQuest({ ...editingQuest, description: e.target.value })}
                                placeholder="Narrative backstory or goal context..."
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-300 mb-1">Category</label>
                                <select
                                    value={editingQuest.category || 'side'}
                                    onChange={e => setEditingQuest({ ...editingQuest, category: e.target.value as any })}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                                >
                                    <option value="main">Main Quest</option>
                                    <option value="side">Side Quest</option>
                                    <option value="personal">Personal Goal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-300 mb-1">Status</label>
                                <select
                                    value={editingQuest.status || 'active'}
                                    onChange={e => setEditingQuest({ ...editingQuest, status: e.target.value as any })}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                                >
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1">Rewards</label>
                            <input
                                type="text"
                                value={editingQuest.rewards || ''}
                                onChange={e => setEditingQuest({ ...editingQuest, rewards: e.target.value })}
                                placeholder="e.g. 200 Gold, Blessed Sword"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                            <button
                                type="button"
                                onClick={() => setEditingQuest(null)}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:bg-stone-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 rounded-xl text-xs font-medium bg-gold-500 hover:bg-gold-600 text-stone-950 font-semibold transition-colors"
                            >
                                Save Quest
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
