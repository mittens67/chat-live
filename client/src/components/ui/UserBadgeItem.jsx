import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

const UserBadgeItem = ({ user, handler, isAdmin }) => {
  return (
    <Col className="userBadge-outer" xs={3}>
      <span>{user.name}</span>
      {/* The admin prop used to be passed in but never declared or used, so
          every member looked identical and showed a remove button */}
      {isAdmin && (
        <Badge bg="secondary" className="ms-1">
          Admin
        </Badge>
      )}
      {handler && (
        <Button
          className="userBadge-link"
          variant="link"
          onClick={handler}
          aria-label={`Remove ${user.name}`}
        >
          X
        </Button>
      )}
    </Col>
  );
};

export default UserBadgeItem;
