'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import getCroppedImg from '@/lib/utils/image-cropper';

interface ImageCropperModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
    onCropComplete: (croppedImageBlob: Blob) => void;
}

export function ImageCropperModal({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation: number) => {
        setRotation(rotation);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            if (croppedImage) {
                onCropComplete(croppedImage);
                onClose();
                // Reset state after closing
                setTimeout(() => {
                    setZoom(1);
                    setRotation(0);
                    setCrop({ x: 0, y: 0 });
                }, 300);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-[#1A1D21] border-white/10 text-white p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 border-b border-white/5 bg-[#141618]">
                    <DialogTitle>Editar Foto de Perfil</DialogTitle>
                </DialogHeader>

                <div className="relative w-full h-[400px] bg-black/50">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteHandler}
                            onZoomChange={onZoomChange}
                            onRotationChange={onRotationChange}
                            classes={{
                                containerClassName: "bg-black/50"
                            }}
                        />
                    )}
                </div>

                <div className="p-6 bg-[#1A1D21] space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <ZoomOut className="w-4 h-4 text-white/50" />
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(value: number[]) => setZoom(value[0])}
                                className="flex-1"
                            />
                            <ZoomIn className="w-4 h-4 text-white/50" />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50">Rotación: {rotation}°</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRotation((r) => r + 90)}
                                className="h-8 w-8 p-0 rounded-full hover:bg-white/10"
                            >
                                <RotateCw className="w-4 h-4 text-white/70" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={onClose} disabled={processing} className="text-white/70 hover:text-white hover:bg-white/5">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={processing} className="bg-primary hover:bg-primary/90 text-white">
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando
                                </>
                            ) : (
                                'Guardar Foto'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
