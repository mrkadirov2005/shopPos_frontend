import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch } from "../../redux/store";
import { getBranchesThunk } from "../../redux/slices/branches/thunks/GetBranchesThunk";
import { getAuthFromStore, getBranchesFromStore } from "../../redux/selectors";
import { useNavigate } from "react-router-dom";
import { setSingleBranch } from "../../redux/slices/branches/branchesReducer";

export default function Integrations() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const authData = useSelector(getAuthFromStore);
  const branches = useSelector(getBranchesFromStore).branches;

  useEffect(() => {
    if (!authData.accessToken || !authData.user?.shop_id) return;

    dispatch(
      getBranchesThunk({
        token: authData.accessToken,
        shop_id: authData.user.shop_id,
      })
    );
  }, [dispatch, authData.accessToken, authData.user?.shop_id]);

  if (!branches || branches.length === 0) {
    return <p>No branches found</p>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Branches</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Location</th>
            <th style={thStyle}>Shop ID</th>
            <th style={thStyle}>Employees</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => (
            <tr
              key={branch.id}
              style={{ cursor: "pointer" }}
              onClick={() => {
                dispatch(setSingleBranch(branch))
                navigate(`/branch`)
                }}
            >
              <td style={tdStyle}>{branch.name}</td>
              <td style={tdStyle}>{branch.location}</td>
              <td style={tdStyle}>{branch.shop_id}</td>
              <td style={tdStyle}>{branch.employees}</td>
              <td style={tdStyle}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/branches/branch`);
                  }}
                  style={buttonStyle}
                >
                  Edit
                </button>{" "}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Delete branch ${branch.name}?`);
                  }}
                  style={{ ...buttonStyle, backgroundColor: "#e53935", color: "white" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  borderBottom: "2px solid #ddd",
  padding: "8px",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};

const buttonStyle: React.CSSProperties = {
  padding: "4px 10px",
  marginRight: 6,
  border: "none",
  borderRadius: 3,
  backgroundColor: "#1976d2",
  color: "white",
  cursor: "pointer",
};
