"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Box,
  Button,
  Skeleton,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search, Mail, Edit } from "@mui/icons-material";
import { getAllUserFromDb } from "@/app/utils/db";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProfileModal from "@/app/components/profileModal";

export default function ProfilesList() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersData = await getAllUserFromDb();
        const parsedUsers = JSON.parse(usersData);
        setUsers(parsedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter((user) => user.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          User Profiles
        </Typography>
        {isLoading ? null : (
          <TextField
            fullWidth
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size="small"
          />
        )}
      </Box>
      {isLoading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Box key={i}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Skeleton variant="circular" width={100} height={100} sx={{ mx: "auto", mb: 2 }} />
                  <Skeleton variant="text" width="80%" sx={{ mx: "auto", mb: 1 }} />
                  <Skeleton variant="text" width="60%" sx={{ mx: "auto" }} />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      ) : (
        <></>
      )}
      {filteredUsers.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          No users found matching your search.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {filteredUsers.map((user) => (
            <Box key={user._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                  <Avatar
                    src={user.image}
                    alt={user.name}
                    sx={{
                      width: 100,
                      height: 100,
                      mx: "auto",
                      mb: 2,
                      border: "3px solid",
                      borderColor: "primary.main",
                    }}
                  />

                  <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                    {user.name}
                  </Typography>

                  {user.bio && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                      {user.bio}
                    </Typography>
                  )}

                  {user.email && (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 1 }}>
                      <Mail sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                        {user.email}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: "center", pt: 0 }}>
                  <Button size="small" onClick={() => handleOpenModal(user)}>
                    View Profile
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}
      <ProfileModal open={modalOpen} onClose={handleCloseModal} user={selectedUser} />
    </Container>
  );
}
