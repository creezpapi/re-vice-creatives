'use client';
import { deleteCreativeAndRedirect } from '@/app/admin/(authed)/creatives/[id]/actions';

type Props = { creativeId: string; assetPath: string | null };

export default function DeleteCreativeButton({ creativeId, assetPath }: Props) {
  return (
    <form
      action={async () => {
        await deleteCreativeAndRedirect(creativeId, assetPath);
      }}
    >
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm('Delete this creative? This cannot be undone.')) e.preventDefault();
        }}
        className="h-9 px-4 rounded-full text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-all duration-250 active:scale-95"
      >
        Delete creative
      </button>
    </form>
  );
}
