'use client';

import { useState } from 'react';
import Image from 'next/image';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import type { StudyMemberResponse } from '@/types/study';
import { triggerAlertModal } from '@/utils/alertModalStore';

interface ExitStudyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (nextHostId?: string) => Promise<void> | void;
    isHost?: boolean;
    members?: StudyMemberResponse[];
    currentUserId?: string;
}

function ExitStudyContent({
    onClose,
    onConfirm,
    isHost = false,
    members = [],
    currentUserId,
}: Omit<ExitStudyModalProps, 'isOpen'>) {
    const [isLeaving, setIsLeaving] = useState(false);
    const [selectedHostId, setSelectedHostId] = useState<string | null>(null);

    // 본인(현재 방장)을 제외한 나머지 위임 대상 멤버 리스트
    const delegateCandidates = members.filter((m) => {
        if (currentUserId) return String(m.id) !== String(currentUserId);
        return !m.isHost;
    });

    // 방장이고 위임할 다른 멤버가 있는 경우
    const needDelegation = isHost && delegateCandidates.length > 0;
    // 방장인데 혼자만 남아있는 경우
    const isHostAlone = isHost && delegateCandidates.length === 0;

    const handleConfirm = async () => {
        if (needDelegation && !selectedHostId) {
            triggerAlertModal({
                title: '방장 위임 필요',
                message: '다음 방장을 맡을 스터디원을 선택해 주세요.',
            });
            return;
        }

        try {
            setIsLeaving(true);
            await onConfirm(selectedHostId ?? undefined);
        } catch (error) {
            console.error('스터디 나가기 중 오류가 발생했습니다:', error);
            triggerAlertModal({
                title: '처리 실패',
                message:
                    '스터디를 나가는 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            });
        } finally {
            setIsLeaving(false);
        }
    };

    return (
        <>
            <Modal.Body>
                <div className="flex flex-col items-center text-center pt-4 pb-2 px-3">
                    {/* 타이틀 크기 유지 */}
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {needDelegation
                            ? '방장을 위임하고 나갈까요?'
                            : '이 딥스터디를 나갈까요?'}
                    </h2>

                    {/* 기존 글자 크기(text-sm) 및 행간 복구 */}
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                        {isHostAlone ? (
                            <>
                                마지막 남은 방장이 스터디를 나가면 스터디가
                                완전히 삭제 됩니다.
                            </>
                        ) : (
                            <>딥스터디를 나가면 기록했던 잔디가 사라집니다.</>
                        )}
                    </p>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                        다시 스터디에 돌아와도 잔디는 복구되지 않아요.
                    </p>

                    {/* 차기 방장 선택 목록 */}
                    {needDelegation && (
                        <div className="w-full flex flex-col gap-2.5 mt-5 text-left">
                            <span className="text-sm font-bold text-gray-700 px-1">
                                다음 방장 선택{' '}
                                <span className="text-red-100">*</span>
                            </span>
                            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                                {delegateCandidates.map((member) => {
                                    const isSelected =
                                        selectedHostId === member.id;
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() =>
                                                setSelectedHostId(member.id)
                                            }
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'border-main-30 bg-main-10/40'
                                                    : 'border-main-20 bg-white hover:border-main-30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* 체크박스 */}
                                                <div
                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                                        isSelected
                                                            ? 'border-main-30 bg-main-30'
                                                            : 'border-main-20 bg-white'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <Icon
                                                            name="check"
                                                            className="w-3 h-3 stroke-white stroke-2"
                                                        />
                                                    )}
                                                </div>

                                                {/* 프로필 이미지 */}
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-main-20 bg-white overflow-hidden shrink-0">
                                                    {member.profileImageUrl ? (
                                                        <Image
                                                            src={
                                                                member.profileImageUrl
                                                            }
                                                            alt={`${member.nickname} 프로필`}
                                                            width={32}
                                                            height={32}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Icon
                                                            name="user"
                                                            className="w-4 h-4 text-main-100 stroke-2 fill-current"
                                                        />
                                                    )}
                                                </div>

                                                {/* 닉네임 */}
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {member.nickname}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </Modal.Body>

            <Modal.Footer className="pt-2 mt-0">
                <SquareButton
                    variant="cancel"
                    onClick={onClose}
                    disabled={isLeaving}
                >
                    취소
                </SquareButton>
                <SquareButton
                    onClick={handleConfirm}
                    disabled={isLeaving || (needDelegation && !selectedHostId)}
                >
                    {isLeaving ? '처리 중...' : '확인'}
                </SquareButton>
            </Modal.Footer>
        </>
    );
}

export default function ExitStudyModal({
    isOpen,
    onClose,
    onConfirm,
    isHost = false,
    members = [],
    currentUserId,
}: ExitStudyModalProps) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-105 w-full">
            <ExitStudyContent
                key="exit-study-content"
                onClose={onClose}
                onConfirm={onConfirm}
                isHost={isHost}
                members={members}
                currentUserId={currentUserId}
            />
        </Modal>
    );
}
