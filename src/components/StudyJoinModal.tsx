'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { triggerAlertModal } from '@/utils/alertModalStore';
import type { StudyDetailResponse } from '@/types/study';

interface StudyJoinModalProps {
    study: StudyDetailResponse & { hasPassword?: boolean };
    isOpen: boolean;
    onClose: () => void;
}

export default function StudyJoinModal({
    study,
    isOpen,
    onClose,
}: StudyJoinModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { currentUser } = useCurrentUser();

    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. 비로그인 시 로그인 페이지로 이동 (돌아왔을 때 초대 팝업이 다시 뜨도록 returnUrl 설정)
    const handleLoginRedirect = () => {
        const returnUrl = encodeURIComponent(
            `${pathname}?joinStudy=${study.id}`,
        );
        router.push(`/login?redirect=${returnUrl}`);
    };

    // 스터디 입장 API 호출
    const handleJoinStudy = async () => {
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/studies/${study.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                // 201 Created: 성공 시 모달 닫고 해당 스터디 페이지로 이동
                onClose();
                router.push(`/study/${study.id}`);
                return;
            }

            const errorData = await res.json().catch(() => null);
            const backendMessage = errorData?.message;

            // 백엔드 상태 코드별 triggerAlertModal 분기 처리
            if (res.status === 403) {
                // ForbiddenException: 비밀번호 불일치
                triggerAlertModal({
                    title: '비밀번호 오류',
                    message:
                        backendMessage ||
                        '스터디 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.',
                });
            } else if (res.status === 400) {
                // BadRequestException: 정원 초과 / 최대 개수 초과
                triggerAlertModal({
                    title: '참여 불가',
                    message:
                        backendMessage ||
                        '스터디에 참여할 수 없습니다. 참여 조건이나 정원을 확인해 주세요.',
                });
            } else if (res.status === 409) {
                // ConflictException: 이미 가입된 멤버 -> 바로 입장 처리
                onClose();
                router.refresh();
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
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-100 w-full">
            <Modal.Header title={study.title} />

            <Modal.Body>
                <div className="flex flex-col gap-5">
                    <p className="px-1 text-sm font-medium leading-6 text-gray-400">
                        {study.description}
                    </p>

                    <div className="flex flex-col gap-2.5">
                        {/* 참여 인원 */}
                        <div className="flex flex-col gap-2 rounded-[10px] border border-main-20 bg-white px-4 py-3">
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
                                {study.maxMemberCount}명
                            </div>
                        </div>

                        {/* 스터디 기간 */}
                        <div className="flex flex-col gap-2 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <Icon
                                    name="calendar"
                                    className="stroke-2 stroke-main-30"
                                />
                                <span className="text-sm text-gray-400">
                                    스터디 기간
                                </span>
                            </div>
                            <div className="text-sm font-semibold">
                                {study.startDate} ~ {study.endDate}
                            </div>
                        </div>

                        {/* 태그 */}
                        <div className="flex flex-col gap-2 rounded-[10px] border border-main-20 bg-white px-4 py-3">
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
                                {study.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-sm font-semibold text-gray-600"
                                    >
                                        # {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 비밀번호 입력 (비밀번호 방 + 로그인 상태인 경우만 노출) */}
                        {currentUser && study.hasPassword && (
                            <div className="flex flex-col gap-1.5 mt-2">
                                <label className="text-xs font-semibold text-gray-600">
                                    비밀번호 입력
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="비밀번호를 입력해 주세요"
                                    className="w-full rounded-lg border border-main-20 px-3 py-2 text-sm outline-none transition-all focus:border-main-100"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <SquareButton variant="cancel" onClick={onClose}>
                    취소
                </SquareButton>

                {/* 로그인 여부 버튼 분기 */}
                {!currentUser ? (
                    <SquareButton onClick={handleLoginRedirect}>
                        로그인
                    </SquareButton>
                ) : (
                    <SquareButton
                        onClick={handleJoinStudy}
                        disabled={
                            isSubmitting || (study.hasPassword && !password)
                        }
                    >
                        {isSubmitting ? '처리 중...' : '입장'}
                    </SquareButton>
                )}
            </Modal.Footer>
        </Modal>
    );
}
