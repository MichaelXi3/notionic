import React from "react"
import styled from "@emotion/styled"
import { AiOutlineEye } from "react-icons/ai"
import { useViewCount } from "src/hooks/useViewCount"

type Props = {
  slug: string
  shouldIncrement?: boolean
  className?: string
}

const ViewCount: React.FC<Props> = ({ 
  slug, 
  shouldIncrement = false,
  className 
}) => {
  const { views, isLoading } = useViewCount(slug, shouldIncrement)

  if (isLoading) {
    return (
      <StyledWrapper className={className}>
        <AiOutlineEye className="icon" />
        <span className="count">--</span>
      </StyledWrapper>
    )
  }

  return (
    <StyledWrapper className={className}>
      <AiOutlineEye className="icon" />
      <span className="count">{views.toLocaleString()}</span>
    </StyledWrapper>
  )
}

export default ViewCount

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${({ theme }) => theme.colors.gray11};
  font-size: 0.875rem;
  line-height: 1.25rem;

  .icon {
    font-size: 1rem;
  }

  .count {
    font-weight: 400;
  }
`

