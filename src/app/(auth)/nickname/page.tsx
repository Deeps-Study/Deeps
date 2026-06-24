export default function NicknamePage() {
    const [nickname, setNickname] = useState('');
    const isValid = nickname.trim().length >= 2;

                    <RoundButton
                        variant="complete"
                        isFull
                        type="submit"
                        disabled={!isValid}
                    >
                        완료
                    </RoundButton>
