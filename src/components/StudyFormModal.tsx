'use client';

import { useState, useRef, useEffect } from 'react';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import TagButton from '@/components/TagButton';
import Calendar from '@/app/home/components/Calendar';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { triggerAlertModal } from '@/utils/alertModalStore';
import type { StudyResponse } from '@/types/study';

interface StudyFormModalProps {
    isOpen: boolean;
    onClose?: () => void;
    mode?: 'create' | 'edit';
    initialData?: StudyResponse | null;
    onSuccess?: (updatedStudy?: Partial<StudyResponse>) => void;
}

const participantOptions = [1, 2, 3, 4, 5, 6];

function StudyFormContent({
    mode = 'create',
    initialData,
    onClose,
    onSuccess,
}: Omit<StudyFormModalProps, 'isOpen'>) {
    const isEditMode = mode === 'edit';
    const studyStatus = initialData?.status ?? 'BEFORE_START';
    const isProgress = isEditMode && studyStatus === 'IN_PROGRESS';
    const currentMembers = initialData?.currentMemberCount ?? 1;

    const [title, setTitle] = useState(
        isEditMode ? (initialData?.title ?? '') : '',
    );
    const [rule, setRule] = useState(
        isEditMode ? (initialData?.rule ?? '') : '',
    );
    const [startDate, setStartDate] = useState(
        isEditMode ? (initialData?.startDate ?? '') : '',
    );
    const [endDate, setEndDate] = useState(
        isEditMode ? (initialData?.endDate ?? '') : '',
    );
    const [participants, setParticipants] = useState(
        isEditMode ? (initialData?.maxMemberCount ?? 0) : 0,
    );
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(
        isEditMode ? (initialData?.tags ?? []) : [],
    );
    const [passwordEnabled, setPasswordEnabled] = useState(
        isEditMode ? Boolean(initialData?.hasPassword) : false,
    );
    const [password, setPassword] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, []);

    const isFormValid = Boolean(
        title.trim() &&
        startDate &&
        endDate &&
        participants > 0 &&
        tags.length > 0 &&
        (!passwordEnabled || password.trim() || isEditMode),
    );

    const formatDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        return dateStr.replace(/-/g, '.');
    };

    const handleDateSelect = (start: string, end: string) => {
        if (isProgress) {
            const selectedEnd = end || start;
            if (selectedEnd < startDate) {
                triggerAlertModal({
                    title: '날짜 선택 불가',
                    message: '종료일은 스터디 시작일보다 앞설 수 없습니다.',
                });
                return;
            }
            setEndDate(selectedEnd);
        } else {
            setStartDate(start);
            setEndDate(end);
        }
    };

    const handleRuleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRule(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
        event.preventDefault();
        const trimmedTag = tagInput.trim();
        if (!trimmedTag) return;

        if (!tags.includes(trimmedTag)) {
            setTags((prevTags) => [...prevTags, trimmedTag]);
        }
        setTagInput('');
    };

    const handleSubmit = async () => {
        if (!isFormValid || isSubmitting) return;

        if (isEditMode && participants < currentMembers) {
            triggerAlertModal({
                title: '인원 설정 불가',
                message: `현재 참여 인원(${currentMembers}명)보다 적은 인원으로 설정할 수 없습니다.`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = isEditMode
                ? `/api/studies/${initialData?.id}`
                : '/api/studies';
            const method = isEditMode ? 'PATCH' : 'POST';

            let passwordPayload: string | null | undefined = undefined;

            if (!isEditMode) {
                passwordPayload = passwordEnabled ? password.trim() : null;
            } else {
                if (!passwordEnabled) {
                    passwordPayload = null;
                } else if (password.trim()) {
                    passwordPayload = password.trim();
                } else {
                    passwordPayload = undefined;
                }
            }

            const payload: Record<string, unknown> = {
                title: title.trim(),
                rule: rule.trim() ? rule.trim() : null,
                startDate,
                endDate,
                maxMemberCount: participants,
                tags,
            };

            if (passwordPayload !== undefined) {
                payload.password = passwordPayload;
            }

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.status === 401) {
                triggerSessionExpired();
                return;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const backendMessage = errorData?.message;

                triggerAlertModal({
                    title: isEditMode ? '수정 실패' : '생성 실패',
                    message:
                        backendMessage ||
                        (isEditMode
                            ? '스터디 정보를 수정하지 못했습니다. 다시 시도해 주세요.'
                            : '스터디를 만드는 도중 오류가 발생했습니다. 다시 시도해 주세요.'),
                });
                return;
            }

            if (isEditMode) {
                onSuccess?.({
                    title: title.trim(),
                    rule: rule.trim(),
                    startDate,
                    endDate,
                    maxMemberCount: participants,
                    tags,
                    hasPassword: passwordEnabled,
                });
            } else {
                onSuccess?.();
            }

            onClose?.();
        } catch (error) {
            console.error('스터디 폼 제출 중 오류 발생:', error);
            triggerAlertModal({
                title: '네트워크 연결 오류',
                message:
                    '서버와 통신할 수 없습니다. 인터넷 연결 상태를 확인 후 다시 시도해 주세요.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Modal.Header
                title={isEditMode ? '스터디 정보 수정' : '딥스터디 만들기'}
            />
            <Modal.Body>
                <div className="flex flex-col gap-5 px-1 py-1 overflow-y-auto max-h-[calc(100vh-14rem)] pr-2">
                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <span>
                            스터디 제목 <span className="text-red-100">*</span>
                        </span>
                        <Input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="스터디 제목을 입력해주세요"
                            isFull
                            className="placeholder-gray-300"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <span>스터디 규칙</span>
                        <textarea
                            ref={textareaRef}
                            value={rule}
                            onChange={handleRuleChange}
                            rows={3}
                            placeholder="스터디 진행 방식, 결석 패널티 등 스터디 규칙을 자유롭게 입력해주세요."
                            className="w-full min-h-18 max-h-48 py-2 px-3 text-sm text-gray-600 transition-colors rounded-lg bg-white border border-main-20 focus:outline-none resize-none overflow-y-auto leading-relaxed placeholder-gray-300 focus:border-main-30"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <div className="flex items-center justify-between">
                            <span>
                                스터디 기간{' '}
                                <span className="text-red-100">*</span>
                            </span>
                            {isProgress && (
                                <span className="text-[11px] font-normal text-main-100">
                                    * 진행 중인 스터디는 종료일만 변경
                                    가능합니다
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCalendarOpen((prev) => !prev)}
                            className="flex w-full items-center justify-between rounded-lg border border-main-20 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 cursor-pointer hover:border-main-30 transition-colors text-left"
                            disabled={isSubmitting}
                        >
                            <span
                                className={
                                    startDate
                                        ? 'text-gray-700'
                                        : 'text-gray-300'
                                }
                            >
                                {startDate
                                    ? `${formatDisplay(startDate)} ~ ${formatDisplay(endDate)}`
                                    : '날짜를 선택해 주세요'}
                            </span>
                            <Icon
                                name="calendar"
                                className="stroke-main-30 w-5 h-5"
                            />
                        </button>

                        {isCalendarOpen && (
                            <Calendar
                                startDate={
                                    isProgress
                                        ? new Date().toISOString().split('T')[0]
                                        : startDate
                                }
                                endDate={endDate}
                                onDateSelect={handleDateSelect}
                                onClose={() => setIsCalendarOpen(false)}
                            />
                        )}
                    </div>

                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <div className="flex items-center justify-between">
                            <span>
                                스터디 인원{' '}
                                <span className="text-red-100">*</span>
                            </span>
                            {isEditMode && currentMembers > 1 && (
                                <span className="text-[11px] font-normal text-gray-400">
                                    * 현재 인원({currentMembers}명) 이상으로만
                                    설정 가능
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {participantOptions.map((option) => {
                                const isDisabledOption =
                                    isEditMode && option < currentMembers;

                                return (
                                    <TagButton
                                        key={option}
                                        selected={participants === option}
                                        onClick={() =>
                                            !isDisabledOption &&
                                            setParticipants(option)
                                        }
                                        className={`text-sm py-1 px-3.5 transition-opacity ${
                                            isDisabledOption
                                                ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                                                : ''
                                        }`}
                                        disabled={
                                            isSubmitting || isDisabledOption
                                        }
                                    >
                                        {option}명
                                    </TagButton>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <span>
                            해시 태그 <span className="text-red-100">*</span>
                        </span>
                        <Input
                            value={tagInput}
                            onChange={(event) =>
                                setTagInput(event.target.value)
                            }
                            onKeyDown={handleTagKeyDown}
                            placeholder="태그 입력 후 엔터 (클릭 시 삭제)"
                            isFull
                            className="placeholder-gray-300"
                            disabled={isSubmitting}
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1.5 animate-in fade-in duration-150">
                                {tags.map((tag) => (
                                    <TagButton
                                        key={tag}
                                        onClick={() =>
                                            setTags((prevTags) =>
                                                prevTags.filter(
                                                    (prevTag) =>
                                                        prevTag !== tag,
                                                ),
                                            )
                                        }
                                        className="text-sm"
                                        disabled={isSubmitting}
                                    >
                                        {tag}
                                    </TagButton>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPasswordEnabled((prev) => !prev);
                                        if (passwordEnabled) setPassword('');
                                    }}
                                    className={`flex h-5 w-5 items-center justify-center rounded-sm border cursor-pointer transition-colors ${
                                        passwordEnabled
                                            ? 'border-main-30 bg-main-30'
                                            : 'border-main-20 bg-white'
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    {passwordEnabled ? (
                                        <Icon
                                            name="check"
                                            className="h-3 w-3 stroke-white"
                                        />
                                    ) : null}
                                </button>
                                <span>비밀번호 설정</span>
                            </div>

                            {isEditMode && (
                                <span className="text-[11px] font-normal text-gray-400">
                                    {passwordEnabled
                                        ? initialData?.hasPassword
                                            ? '* 미입력 시 기존 비밀번호 유지'
                                            : '* 비밀번호를 새로 설정합니다'
                                        : initialData?.hasPassword
                                          ? '* 체크 해제 시 비밀번호가 삭제됩니다'
                                          : ''}
                                </span>
                            )}
                        </div>

                        {passwordEnabled && (
                            <div>
                                <Input
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    type="password"
                                    placeholder={
                                        isEditMode && initialData?.hasPassword
                                            ? '새 비밀번호를 입력해주세요 (미입력 시 기존 유지)'
                                            : '새로운 비밀번호를 입력해주세요'
                                    }
                                    isFull
                                    className="placeholder-gray-300"
                                    disabled={isSubmitting}
                                />

                                <p className="px-1 mt-1 text-xs font-normal leading-relaxed text-gray-400">
                                    * 다시 확인할 수 없으며, 스터디 설정에서
                                    재등록할 수 있습니다.
                                </p>
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
                <SquareButton
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                >
                    {isSubmitting
                        ? isEditMode
                            ? '수정중...'
                            : '생성중...'
                        : isEditMode
                          ? '수정'
                          : '확인'}
                </SquareButton>
            </Modal.Footer>
        </>
    );
}

export default function StudyFormModal({
    isOpen,
    onClose,
    mode = 'create',
    initialData,
    onSuccess,
}: StudyFormModalProps) {
    if (!isOpen) return null;

    const contentKey = mode === 'edit' ? `edit-${initialData?.id}` : 'create';

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-110 w-full">
            <StudyFormContent
                key={contentKey}
                mode={mode}
                initialData={initialData}
                onClose={onClose}
                onSuccess={onSuccess}
            />
        </Modal>
    );
}
