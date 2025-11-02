'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface FindReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FindReplaceDialog({ open, onOpenChange }: FindReplaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className='pr-8'>
          <DialogTitle className="font-headline">Find & Replace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="find-input" className="sr-only">Find</Label>
                <Input id="find-input" placeholder="Find" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="replace-input" className="sr-only">Replace</Label>
                <Input id="replace-input" placeholder="Replace with" />
            </div>
            <Separator />
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="match-case" disabled />
                        <Label htmlFor="match-case" className='text-muted-foreground'>Match case</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="whole-word" disabled />
                        <Label htmlFor="whole-word" className='text-muted-foreground'>Whole word</Label>
                    </div>
                </div>
                 <div className='text-sm text-muted-foreground'>
                    0 of 0
                </div>
            </div>
        </div>
        <DialogFooter className="sm:justify-between">
            <div className='flex gap-2'>
                <Button variant="outline" size="icon" disabled><ChevronUp className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" disabled><ChevronDown className='w-4 h-4' /></Button>
            </div>
            <div className='flex gap-2'>
                 <Button variant="secondary" disabled>Replace</Button>
                 <Button variant="secondary" disabled>Replace All</Button>
            </div>
        </DialogFooter>
         <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
