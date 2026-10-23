'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { triggerAlertModal } from '@/utils/alertModalStore';
import type { StudyResponse } from '@/types/study';

interface StudyJoinModalProps {
    study: StudyResponse & { hasPassword?: boolean };
    isOpen: boolean;
    onClose: () => void;
}

function StudyJoinContent({
    study,
    onClose,
}: Omit<StudyJoinModalProps, 'isOpen'>) {
    const router = useRouter();
    const pathname = usePathname();
    const { currentUser } = useCurrentUser();

    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLoginRedirect = () => {
        const returnUrl = encodeURIComponent(
            `${pathname}?joinStudy=${study.id}`,
        );
        router.push(`/login?redirect=${returnUrl}`);
    };

    const handleJoinStudy = async () => {
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/studies/${study.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: password.trim() ? password.trim() : undefined,
                }),
            });

            if (res.ok) {
                onClose();
                router.push(`/study/${study.id}`);
                return;
            }

            const errorData = await res.json().catch(() => null);
            const backendMessage = errorData?.message;

            if (res.status === 403) {
                triggerAlertModal({
                    title: '비밀번호 오류',
                    message:
                        backendMessage ||
                        '스터디 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.',
                });
            } else if (res.status === 400) {
                triggerAlertModal({
                    title: '참여 불가',
                    message:
                        backendMessage ||
                        '스터디에 참여할 수 없습니다. 참여 조건이나 정원을 확인해 주세요.',
                });
            } else if (res.status === 409) {
                onClose();
                router.push(`/study/${study.id}`);
            } else {
                triggerAlertModal({
                    title: '참여 실패',
                    message:
                        backendMessage ||
                        '스터디 참여 신청 중 오류가 발생했습니다.',
                });
            }
        } catch (error) {
            console.error('스터디 참여 요청 오류:', error);
            triggerAlertModal({
                title: '네트워크 오류',
                message:
                    '서버와의 통신이 원활하지 않습니다. 네트워크 연결을 확인해 주세요.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Modal.Header title={study.title} />

            <Modal.Body>
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2.5">
                        {/* 참여 인원 */}
                        <div className="flex flex-col gap-4.5 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <Icon
                                    name="users"
                                    className="stroke-3 stroke-main-30"
                                />
                                <span className="text-sm text-gray-400">
                                    참여인원
                                </span>
                            </div>
                            <div className="text-sm font-semibold">
                                {study.currentMemberCount} /{' '}
                                {study.maxMemberCount}
                            </div>
                        </div>

                        {/* 기간 */}
                        <div className="flex flex-col gap-4.5 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <Icon
                                    name="calendar"
                                    className="stroke-2 stroke-main-30"
                                />
                                <span className="text-sm text-gray-400">
                                    기간
                                </span>
                            </div>
                            <div className="text-sm font-semibold">
                                {study.startDate} ~ {study.endDate}
                            </div>
                        </div>

                        {/* 태그 */}
                        <div className="flex flex-col gap-4.5 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <Icon
                                    name="tag"
                                    className="stroke-2 stroke-main-30"
                                />
                                <span className="text-sm text-gray-400">
                                    태그
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {study.tags.map((tag, index) => (
                                    <span
                                        key={`${tag}-${index}`}
                                        className="text-sm font-semibold text-gray-600"
                                    >
                                        # {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 스터디 규칙 */}
                        {study.rule && (
                            <div className="flex flex-col gap-2 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <Icon
                                        name="check"
                                        className="stroke-2 stroke-main-30 w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-400">
                                        스터디 규칙
                                    </span>
                                </div>
                                <div className="max-h-36 overflow-y-auto text-sm font-semibold text-gray-700 leading-relaxed whitespace-pre-wrap pr-1">
                                    {study.rule}
                                </div>
                            </div>
                        )}

                        {/* 비밀번호 입력 (비밀번호가 걸려있고 로그인한 상태일 때 노출) */}
                        {currentUser && study.hasPassword && (
                            <div className="flex flex-col gap-1.5 mt-1">
                                <label className="text-xs font-semibold text-gray-600">
                                    비밀번호 입력{' '}
                                    <span className="text-red-100">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="비밀번호를 입력해 주세요"
                                    className="w-full rounded-lg border border-main-20 px-3 py-2 text-sm text-gray-700 outline-none transition-all placeholder-gray-300 focus:border-main-30"
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <SquareButton
                    variant="cancel"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    취소
                </SquareButton>

                {!currentUser ? (
                    <SquareButton onClick={handleLoginRedirect}>
                        로그인
                    </SquareButton>
                ) : (
                    <SquareButton
                        onClick={handleJoinStudy}
                        disabled={
                            isSubmitting ||
                            (Boolean(study.hasPassword) && !password.trim())
                        }
                    >
                        {isSubmitting ? '입장 중...' : '입장'}
                    </SquareButton>
                )}
            </Modal.Footer>
        </>
    );
}

export default function StudyJoinModal({
    study,
    isOpen,
    onClose,
}: StudyJoinModalProps) {
    if (!isOpen || !study) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-100 w-full">
            <StudyJoinContent
                key={`join-${study.id}`}
                study={study}
                onClose={onClose}
            />
        </Modal>
    );
}
