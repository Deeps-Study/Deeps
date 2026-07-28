import { triggerSessionExpired } from './sessionExpiredStore';

export const DEEPS_IMAGE_UPLOAD_GUIDE =
    '최대 5MB, JPG·PNG·WEBP만 업로드할 수 있어요.\n용량과 형식을 확인해 주세요.';

export async function uploadDeepsImage(
    studyId: string,
    file: File,
): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`/api/studies/${studyId}/deeps/images`, {
        method: 'POST',
        body: formData,
    });

    if (res.status === 401) {
        triggerSessionExpired();
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        throw new Error(DEEPS_IMAGE_UPLOAD_GUIDE);
    }

    const data: { url: string } = await res.json();
    return data.url;
}
