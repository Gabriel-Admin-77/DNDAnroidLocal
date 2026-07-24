'use client';
import { useState } from 'react';
import { Image, Sparkles, Maximize2, X } from 'lucide-react';
import { getSceneImageForLocation, generateArtPromptFromScene } from '@/lib/scene-images';

interface SceneImageProps {
    sceneText: string;
    location: string;
}

export default function SceneImageDisplay({ sceneText, location }: SceneImageProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const imageUrl = getSceneImageForLocation(location);
    const promptText = generateArtPromptFromScene(sceneText, location);

    return (
        <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 mb-4 group shadow-xl">
            <div className="relative aspect-video w-full overflow-hidden">
                <img
                    src={imageUrl}
                    alt={location}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />

                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gold-400 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800">
                            Scene Illustration
                        </span>
                        <h4 className="text-sm font-serif text-stone-200 mt-1 font-semibold">{location}</h4>
                    </div>

                    <button
                        onClick={() => setIsFullscreen(true)}
                        className="p-2 bg-stone-950/80 hover:bg-stone-900 text-stone-300 rounded-lg border border-stone-800 transition-colors"
                        title="Expand View"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Fullscreen Overlay */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-6 right-6 p-3 text-stone-400 hover:text-stone-100 bg-stone-900 border border-stone-800 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="max-w-4xl w-full">
                        <img src={imageUrl} alt={location} className="w-full max-h-[75vh] object-contain rounded-2xl border border-stone-800 shadow-2xl mb-4" />
                        <p className="text-center text-xs text-stone-400 font-mono italic max-w-2xl mx-auto">"{promptText}"</p>
                    </div>
                </div>
            )}
        </div>
    );
}
