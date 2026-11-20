import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import styled from 'styled-components';
import { LoadingState } from '../../components/LoadingState';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/employees', label: 'Employees' },
  { to: '/insights', label: 'Insights' },
];

/**
 * Page frame: header with brand, main navigation and theme toggle.
 * Phones: brand + toggle on the first row, navigation tabs below.
 * Tablet and up: everything on one row.
 */
export function AppLayout() {
  return (
    <>
      <Header>
        <HeaderInner>
          <Brand to="/">
            <BrandMark aria-hidden="true">A</BrandMark>
            <span>
              ACME <BrandSuffix>Salary</BrandSuffix>
            </span>
          </Brand>

          <Nav aria-label="Main">
            <NavList>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavItem to={item.to}>{item.label}</NavItem>
                </li>
              ))}
            </NavList>
          </Nav>

          <ToggleArea>
            <ThemeToggle />
          </ToggleArea>
        </HeaderInner>
      </Header>

      <Main>
        {/* Shown while a lazily loaded page (e.g. Insights) downloads. */}
        <Suspense fallback={<LoadingState label="Loading page…" />}>
          <Outlet />
        </Suspense>
      </Main>
    </>
  );
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderInner = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'brand toggle'
    'nav nav';
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: auto 1fr auto;
    grid-template-areas: 'brand nav toggle';
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  }
`;

const Brand = styled(Link)`
  grid-area: brand;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.heading};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-decoration: none;
`;

const BrandMark = styled.span`
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
`;

const BrandSuffix = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
`;

const Nav = styled.nav`
  grid-area: nav;
`;

const NavList = styled.ul`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  padding: 0;
  list-style: none;

  & > li {
    flex: 1;
  }

  ${({ theme }) => theme.media.tablet} {
    & > li {
      flex: none;
    }
  }
`;

/** NavLink adds aria-current="page" to the active link; we style that, so a11y and visuals match. */
const NavItem = styled(NavLink)`
  display: block;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-align: center;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.onAccent};
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &[aria-current='page'] {
    color: ${({ theme }) => theme.colors.onAccent};
    background: ${({ theme }) => theme.colors.accent};
  }
`;

const ToggleArea = styled.div`
  grid-area: toggle;
`;

const Main = styled.main`
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};

  ${({ theme }) => theme.media.tablet} {
    padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};
  }
`;
