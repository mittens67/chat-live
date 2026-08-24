import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import { DEFAULT_AVATAR, onAvatarError } from "../../lib/defaultAvatar";

const UserListItem = ({ user, handler }) => {
  return (
    <Container fluid>
      {/* A real button, so the row is focusable and works from the keyboard.
          It was a div with an onClick, which neither screen readers nor tab
          navigation could reach. */}
      <Row
        as="button"
        type="button"
        onClick={handler}
        className="list-item"
        aria-label={`Start a chat with ${user.name}`}
      >
        <Col xs={2} className="list-avatar">
          <Image
            src={user.picture || DEFAULT_AVATAR}
            onError={onAvatarError}
            alt=""
            style={{ width: "2rem" }}
            roundedCircle
          />
        </Col>
        <Col xs={9} className="list-info">
          <span className="list-info__name">{user.name}</span>
          <span className="list-info__email">{user.email}</span>
        </Col>
      </Row>
    </Container>
  );
};

export default UserListItem;
