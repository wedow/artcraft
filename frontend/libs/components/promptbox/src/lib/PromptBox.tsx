interface PromptBoxProps {
  is3D: boolean;
}

export const PromptBox = ({
    is3D
}: PromptBoxProps) => {
    return (
        {is3D ?? PromptBox3D : PromptBox2D}
    );
};
