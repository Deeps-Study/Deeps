'use client';

import { useState } from 'react';
import Icon from '@/ui/Icon/Icon';
import { StudyResponse } from '@/types/study';
import Tag from '@/components/Tag';
import { CopyToast } from './CopyToast';

interface StudyInfoProps {
    study: StudyResponse;
    onEditClick?: () => void;
    onDeleteClick?: () => void;
}

export default function StudyInfo({
    study,
    onEditClick,
    onDeleteClick,
}: StudyInfoProps) {
    const [showToast, setShowToast] = useState(false);

    const handleCopyLink = () => {
        const inviteUrl = `${window.location.origin}/home?joinStudy=${study.id}`;
        navigator.clipboard.writeText(inviteUrl);

        setShowToast(true);

        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-600 tracking-tight">
                    {study.title}
                </h1>

                {/* 방장 전용 관리 버튼 (수정 / 삭제) */}
                {study.isHost && (
                    <div className="flex items-center gap-2">
                        {onEditClick && study.status !== 'ENDED' && (
                            <button
                                type="button"
                                onClick={onEditClick}
                                className="text-xs font-semibold text-gray-400 hover:text-main-100 transition-colors cursor-pointer"
                            >
                                정보 수정
                            </button>
                        )}
                        {onEditClick &&
                            onDeleteClick &&
                            study.status !== 'ENDED' && (
                                <span className="text-xs text-gray-300">|</span>
                            )}
                        {onDeleteClick && (
                            <button
                                type="button"
                                onClick={onDeleteClick}
                                className="text-xs font-semibold text-gray-400 hover:text-red-100 transition-colors cursor-pointer"
                            >
                                스터디 삭제
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 줄바꿈(whitespace-pre-wrap) 보존 및 가독성 개선 */}
            {study.rule && (
                <p className="text-sm font-medium text-gray-500 max-w-xl leading-relaxed whitespace-pre-wrap bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                    {study.rule}
                </p>
            )}

            <p className="text-xs font-medium text-gray-400 tracking-wide">
                {study.startDate} ~ {study.endDate}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-base font-bold text-main-50 mr-1">#</span>
                {study.tags.map((tag) => (
                    <Tag
                        key={tag}
                        variant="outline"
                        className="rounded-full border border-main-20 bg-white px-3.5 py-1 text-xs font-medium text-gray-600"
                    >
                        {tag}
                    </Tag>
                ))}
            </div>

            <button
                onClick={handleCopyLink}
                className="flex w-fit items-center gap-2 text-sm font-bold text-main-100 hover:text-main-60 transition-colors mt-2 cursor-pointer"
            >
                <Icon name="link" className="h-4.5 w-4.5 stroke-1" />
                스터디 링크 복사
            </button>

            <CopyToast show={showToast} />
        </div>
    );
}
